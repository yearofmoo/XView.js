var XView = new Class({

  Implements : [Options],

  options : {
    fallback : true,
    parsers : ['XView','HTML'],
    parserOptions : {
      XView : { 
      },
      HTML : {

      }
    }
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

    this.xviewResponse = false;

    var parsers = this.options.parsers;
    for(var i=0;i<parsers.length;i++) {
      try {
        var parser = parsers[i];
        var C = XView.Parsers[parser];
        if(C && C.test(html)) {
          this.runParser(parser,html);
          break;
        }
      }
      catch(e){};
    }

    if(this.xviewResponse == false) {
      if(this.options.fallback) {
        this.fallback(html);
      }
      else {
        this.onFailure();
      }
    }
  },

  runParser : function(parser,html) {
    var options = this.options.parserOptions[parser];
    parser = XView.Parsers[parser];
    parser.options = Object.append(parser.options,options);
    var data = parser.parse(html);
    if(data) {
      this.parseData(data);
    }
  },

  parseData : function(data) {
    this.setRawHTML(data.html);
    this.setAssets(data.assets);
    this.setHeaders(data.headers);
    this.setContent(data.content);
    this.setElement(data.element);
    this.xviewResponse = true;
    if(data.contentHTML) {
      this.setContentHTML(data.contentHTML);
    }
  },

  fallback : function(html) {
    var content = new Element('div').set('html',html);
    this.parseData({
      content : content,
      element : content,
      headers : {},
      assets : [],
      html : html
    });
  },

  getBlock : function(selector) {
    return this.getElement().getElement(selector);
  },

  getBlockHTML : function(selector) {
    return this.getBlock(selector).get('html');
  },

  getElement : function() {
    return this.element;
  },

  setElement : function(element) {
    this.element = element;
  },

  setContent : function(content) {
    this.content = content;
    if(this.options.scope) {
      this.content = this.getContentScope(this.options.scope);  
    }
  },

  setRawHTML : function(html) {
    this.html = html;
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

  getContentHTML : function() {
    if(!this.contentHTML) {
      this.contentHTML = this.getContent().get('html');
    }
    return this.contentHTML;
  },

  setContentHTML : function(html) {
    this.contentHTML = html;
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

  setHeaders : function(headers) {
    for(var i in headers) {
      this.setHeader(i,headers[i]);
    }
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
    return this.setHeader('assets',assets);
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
      this.getContent().destroy();
      this.getElement().destroy();
    }
    catch(e) {}
  }

});

XView.Parsers = {};

XView.Parsers.XView = {

  options : {
    rootClassName : 'xview-response',
    contentClassName : 'xview-content',
    headerClassName : 'xview-header',
  },

  test : function(html) {
    var element = this.parseToElement(html);
    return element && element.hasClass(this.options.rootClassName);
  },

  parseToElement : function(html) {
    var element = Elements.from(html);
    element = ['elements','array'].indexOf(typeOf(element)) >= 0 ? element[0] : element;
    return element;
  },

  parse : function(html) {
    var element = this.parseToElement(html);
    var contentClass = this.options.contentClassName;
    var headerClass = this.options.headerClassName;
    var content = element.getElement('.'+contentClass);
    var header = element.getElement('.'+headerClass);
    var headerText = (header.get('html') || '').trim();
    var headerData;
    if(headerText.length > 0 && headerText.charAt(0) == '{') {
      headerData = JSON.decode(headerText);
    }
    headerData = typeOf(headerData) == 'object' ? headerData : {};
    var assets = headerData['assets'] || [];
    delete headerData['assets'];
    return {
      raw : html,
      element : element,
      content : content,
      headers : headerData,
      assets : assets
    };
  },

};

XView.Parsers.HTML = {

  test : function(html) {
    return html.contains('<html');
  },

  parse : function(html) {
    var iframe = this.createTemporaryIFrame(html);
    var doc = iframe.contentDocument ? iframe.contentDocument : iframe.contentWindow.document;
    var content = this.createContent(doc, html);
    var data = {
      raw : html,
      element : content,
      content : content,
      assets : this.parseAssets(doc, html),
      headers : this.parseHeaders(doc, html)
    };

    document.id(iframe).destroy();
    return data;
  },

  createContent : function(doc, html) {
    return new Element('div').set('html',doc.body.innerHTML);
  },

  createTemporaryIFrame : function(html) {
    var contentIFrame = document.createElement('iframe');
    contentIFrame.style.width = contentIFrame.style.height = '0px';
    document.body.appendChild(contentIFrame);
    var doc = contentIFrame.contentDocument ? contentIFrame.contentDocument : contentIFrame.contentWindow.document;
    doc.open('text/html',false);
    doc.write(html);
    doc.close();
    return contentIFrame;
  },

  parseHeaders : function(doc, html) {
    var headers = {};
    var title = doc.title;
    if(title) {
      headers['title']=title; 
    }

    var className = doc.body.className;
    if(className) {
      headers['className']=className;
    }

    var id = doc.body.id;
    if(id) {
      headers['id']=id;
    }

    return headers;
  },

  parseAssets : function(doc, html) {
    doc.getElements = document.getElements.bind(doc);

    var assets = [];

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
      assets = [].concat(javascripts).concat(stylesheets);
    }

    return assets;
  }

};
