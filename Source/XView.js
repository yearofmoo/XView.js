var XView = new Class({

  Implements : [Options],

  options : {
    fallback : true,
    rootClassName : 'xview-response',
    contentSelector : '.xview-content',
    headerSelector : '.xview-header'
  },

  initialize : function(html) {
    this.html = html;
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
    return this.content = content;
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
