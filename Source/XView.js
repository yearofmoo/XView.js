var XView = new Class({

  Implements : [Options],

  options : {
    fallback : true,
    rootClassName : 'xview-response',
    contentSelector : '.xview-content',
    headerSelector : '.xview-header'
  },

  initialize : function(html,options) {
    this.header = {};
    this.html = html;
    this.setOptions(options);
    this.parse(html);

    if(!Elements.from) {
      throw new Error('Xview.js: MooTools-more is not included');
    }
  },

  parse : function(html) {
    if(!html || typeOf(html) != 'string' || html.length == 0) {
      this.onEmpty();
      return;
    }

    if(html.contains('<html')) {
      this.parseHTMLPage(html);
      return;
    }

    var element = Elements.from(html);
    element = ['elements','array'].indexOf(typeOf(element)) >= 0 ? element[0] : element;
    if(typeOf(element)=='null') {
      element = new Element('div').set('html',html);
    }

    this.xviewResponse = false;

    try {
      this.element = element;
      if(!this.element.hasClass(this.options.rootClassName)) {
        throw new Error;
      }

      var content = this.getBlock(this.options.contentSelector); 
      if(!content) {
        throw new Error;
      }

      this.parseContent(content);

      var header = this.getBlock(this.options.headerSelector); 
      if(!header) {
        throw new Error;
      }

      this.parseHeader(header);

      this.xviewResponse = true;
    }
    catch(e) {
      if(this.options.fallback && element) {
        this.fallback(element);
      }
      else {
        this.onFailure();
      }
    }
  },

  parseHTMLPage : function(html) {
    var contentIFrame = document.createElement('iframe');
    contentIFrame.style.width = contentIFrame.style.height = '0px';
    document.body.appendChild(contentIFrame);
    var doc = contentIFrame.contentDocument ? contentIFrame.contentDocument : contentIFrame.contentWindow.document;
    doc.open('text/html',false);
    doc.write(html);
    doc.close();

    this.parseElementsFromTemporaryIFrame(doc,html);

    var contentHTML = doc.body.innerHTML;
    document.id(contentIFrame).destroy();

    this.html = contentHTML;
    this.content = new Element('div').set('html',contentHTML);
  },

  parseElementsFromTemporaryIFrame : function(doc,html) {
    var title = doc.title;
    if(title) {
      this.setHeader('title',title);
    }

    var className = doc.body.className;
    if(className) {
      this.setHeader('classes',className);
    }

    var id = doc.body.id;
    if(id) {
      this.setHeader('id',id);
    }

    doc.getElements = document.getElements.bind(doc);

    var stylesheets = doc.getElements('link').map(function(link) {
      if(link.href.length > 0 && (link.type.toLowerCase() == 'text/css' || link.rel.toLowerCase() == 'stylesheet')) {
        return link.href;
      }
    }).clean();

    var javascripts = [];
    var matches = html.match(/<script.+?>/g);
    if(matches) {
      for(var i=0;i<matches.length;i++) {
        var attr = matches[i].match(/<script.+?src\s*=\s*['"]?(.+?)['"\s]/);
        if(attr) {
          var src = attr[1];
          if(src.length > 0) {
            javascripts.push(src);
          }
        }
      }
    }

    if(javascripts.length > 0 || stylesheets.length > 0) {
      var assets = [].concat(javascripts).concat(stylesheets);
      this.setAssets(assets);
    }
  },

  getBlock : function(selector) {
    return this.getElement().getElement(selector);
  },

  getBlockHTML : function(selector) {
    return this.getBlock(selector).get('html');
  },

  fallback : function(element) {
    this.content = element;
    this.header = {};
  },

  getElement : function() {
    return this.element;
  },

  parseContent : function(content) {
    this.content = content;
    if(this.options.scope) {
      this.content = this.getContentScope(this.options.scope);  
    }
  },

  parseHeader : function(header) {
    var content = header.get('html').trim();
    this.header = JSON.decode(content);
    header.destroy();
  },

  getRawHTML : function() {
    return this.html;
  },

  getHTML : function() {
    return this.getContent().get('html');
  },

  getContent : function() {
    return this.content;
  },

  getContentScope : function(selector) {
    return this.getContent().getElement(selector);
  },

  getHeaderContent : function() {
    return this.header || {};
  },

  getHeaderNames : function() {
    return Object.keys(this.getHeaders());
  },

  getHeaders : function() {
    return this.getHeaderContent();
  },

  getHeader : function(header) {
    return this.getHeaderContent()[header];
  },

  setHeader : function(header,value) {
    this.getHeaderContent()[header]=value;
  },

  getPageID : function() {
    return this.getHeader('id');
  },

  getTitle : function() {
    return this.getHeader('title');
  },

  getClassName : function() {
    return this.getHeader('className');
  },

  getAssets : function() {
    return this.getHeader('assets') || [];
  },

  setAssets : function(assets) {
    this.setHeader('assets',assets);
  },

  isXViewResponse : function() {
    return this.xviewResponse;
  },

  isFailure : function() {
    return this.failure;
  },

  onFailure : function() {
    this.failure = true;
  },

  isEmpty : function() {
    return this.empty;
  },

  toElement : function() {
    return this.content;
  },

  onEmpty : function() {
    this.empty = true;
  },

  destroy : function() {
    try {
      this.getElement().destroy();
    }
    catch(e) {}
  }

});
