/**
 * @author jonobr1 / http://jonobr1.com/
 * Dependent on Three.js and underscore.js
 */

(function() {

  var root = this;
  var objects = [];

  var twos = [];

  /**
   * Constants
   */
  var PI = Math.PI,
    TWO_PI = Math.PI * 2.0,
    HALF_PI = Math.PI * 0.5;

  /**
   * Cross browser events.
   */
  var dom = {

    hasEventListeners: _.isFunction(document.body.addEventListener),

    bind: function(elem, event, func, bool) {
      if (this.hasEventListeners) {
        elem.addEventListener(event, func, !!bool);
      } else {
        elem.attachEvent('on' + event, func);
      }
      return this;
    },

    unbind: function(elem, event, func, bool) {
      if (this.hasEventListeners) {
        elem.removeEventListeners(event, func, !!bool);
      } else {
        elem.detachEvent('on' + event, func);
      }
      return this;
    }

  };

  /**
   * Two.js is a two-dimensional drawing api built on top of Three.js
   * meant for the browser.
   *
   * @class
   */
  var Two = function(params) {

    var params = _.defaults(params || {}, {
      type: Two.TYPES.webgl,
      autoplay: true,
      width: 640,
      height: 480,
      fullscreen: false
    });

    this.__playing = params.autoplay;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, params.width, 0, params.height, 0);

    this.scene.add(this.camera);

    var canvas = document.createElement('canvas');
    if (params.types === Two.TYPES.webgl
      && canvas.getContext('webgl')
      || canvas.getContext('experimental-webgl')) {

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: canvas
      });
      params.type = Two.TYPES.webgl;

    } else {

      this.renderer = new THREE.CanvasRenderer({
        canvas: canvas
      });
      params.type = Two.TYPES.canvas2d;

    }

    this.type = params.type;

    if (params.fullscreen) {

      var fitted = _.bind(fitToWindow, this);

      _.extend(document.body.style, {
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed'
      });
      dom.bind(window, 'resize', fitted);
      fitted();

    } else {

      this.renderer.setSize(params.width, params.height);
      this.width = params.width;
      this.height = params.height;

    }

    twos.push(this);

  };

  _.extend(Two.prototype, {

    /**
     * DOM
     */

    appendTo: function(elem) {

      if (!_.isElement(elem)) {
        return this;
      }

      elem.appendChild(this.renderer.domElement);

      return this;

    },

    onResize: function(func) {

      this.__onResize = func;
      return this;

    },

    /**
     * Controls
     */

    play: function() {

      this.__playing = true;
      return this;

    },

    pause: function() {

      this.__playing = false;
      return this;

    },

    /**
     * Rendering
     */

    render: function() {

      if (!this.__playing) {
        return this;
      }

      _.each(objects, function(object) {
        if (_.isFunction(object.__onUpdate)) {
          object.__onUpdate();
        }
      });

      this.renderer.render(this.scene, this.camera);
      return this;

    },

    addRectangle: function(x, y, width, height) {

      var rect = new Two.Rectangle(x, y, width, height);
      this.scene.add(rect.mesh);
      return rect;

    },

    addCircle: function(x, y, radius) {

      var circle = new Two.Circle(x, y, radius);
      this.scene.add(circle.mesh);
      return circle;

    },

    addLine: function(x1, y1, x2, y2) {

      var line = new Two.Line(x1, y1, x2, y2);
      this.scene.add(line.mesh);
      return line;

    },

    addPolygon: function() {

      var points = [];
      for (var i = 0, l = arguments.length; i < l; i+=2) {
        points.push(new THREE.Vector3(arguments[i], arguments[i + 1], 0));
      }

      var poly = new Two.Polygon(points);
      this.scene.add(poly.mesh);
      return poly;

    }

  });

  _.extend(Two, {

    VERSION: 0.1,

    TYPES: {
      webgl: 'webgl',
      canvas2d: 'canvas2d'
    },

    RESOLUTION: 32,

    /**
     *
     */
    Rectangle: function(x, y, width, height) {

      this.geometry = new THREE.CubeGeometry(width, height, 0);
      this.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
      this.mesh = new THREE.Mesh(this.geometry, this.material);

      this.mesh.position.x = x;
      this.mesh.position.y = y;

      var half_width = width / 2;
      var half_height = height / 2;

      this.outline = new Two.Line(
        - half_width, - half_height,
          half_width, - half_height,
          half_width,   half_height,
        - half_width,   half_height,
        - half_width, - half_height
      );
      this.mesh.add(this.outline.mesh);

      objects.push(this);

    },

    /**
     *
     */
    Circle: function(x, y, radius) {

      this.geometry = new THREE.CylinderGeometry(radius, radius, 0, Two.RESOLUTION);
      this.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
      this.mesh = new THREE.Mesh(this.geometry, this.material);

      this.mesh.position.x = x;
      this.mesh.position.y = y;
      this.mesh.rotation.x = HALF_PI;

      var points = _.map(_.range(Two.RESOLUTION), function(i) {
        var p = (i / Two.RESOLUTION);
        var a = TWO_PI * p;
        return new THREE.Vector3(radius * Math.cos(a) - radius / 2, 0, radius * Math.sin(a));
      });

      points.push(points[0]);

      this.outline = new Two.Line(points);
      this.mesh.add(this.outline.mesh);

      objects.push(this);

    },
    /**
     * 
     */
    Line: function(x1, y1, x2, y2) {

      var points = [];
      if (_.isArray(x1)) {
        points = x1;
        x1 = points[0].x;
        y1 = points[0].y;
      } else {
        for (var i = 0, l = arguments.length; i < l; i+=2) {
          points.push(new THREE.Vector3(arguments[i] - x1, arguments[i + 1] - y1, 0));
        }
      }

      this.geometry = new THREE.Geometry();
      this.geometry.vertices = points;

      this.material = new THREE.LineBasicMaterial({ color: 0x000000 });
      this.mesh = new THREE.Line(this.geometry, this.material);

      this.mesh.position.x = x1;
      this.mesh.position.y = y1;

      objects.push(this);

    },

    Polygon: function(points) {

      var first = points[0].clone();

      _.each(points, function(p) {
        p.subSelf(first);
      });

      var shape = new THREE.Shape(points);
      this.geometry = new THREE.ExtrudeGeometry(shape, { amount: 0 });
      this.material = new THREE.MeshBasicMaterial({ color: 0x000000 });

      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.rotation.x = PI;
      this.mesh.rotation.z = -HALF_PI;
      this.mesh.position.x = first.x;
      this.mesh.position.y = first.y;

      points.push(points[0]);

      this.outline = new Two.Line(points);
      this.mesh.add(this.outline.mesh);

      objects.push(this);

    }

  });

  var ShapeProto = {

    update: function(func) {
      this.__onUpdate = func;
      return this;
    },

    scale: function(amt) {

      this.mesh.scale.x = amt;
      this.mesh.scale.y = amt;
      return this;

    },

    rotate: function(radians) {

      this.mesh.rotation.z = radians;
      return this;

    },

    position: function(x, y) {

      this.mesh.position.x = x;
      this.mesh.position.y = y;

      return this;

    }

  };

  /**
   * Prototype for all objects have fill-like material
   * Two.Rectangle
   * Two.Circle
   * TWo.Polygon
   */
  var FillProto = {

    fill: function(r, g, b, a) {
      var length = arguments.length;
      if (length <= 1) {
        g = b = r;
        a = 1.0;
      } else if (length <= 3) {
        a = 1.0;
      }
      this.material.color.setRGB(r, g, b);
      this.material.opacity = a;
      return this;
    }

  };

  /**
   * Prototype for all objects that have stroke-like material
   * Two.Line
   */
  var StrokeProto = {

    stroke: function(r, g, b, a) {
      var length = arguments.length;
      if (length <= 1) {
        g = b = r;
        a = 1.0;
      } else if (length <= 3) {
        a = 1.0;
      }
      if (_.isObject(this.outline)) {
        this.outline.material.color.setRGB(r, g, b);
        this.outline.material.opacity = a;
      } else {
        this.material.color.setRGB(r, g, b);
        this.material.opacity = a;
      }
      return this;
    },

    strokeWeight: function(n) {
      if (_.isObject(this.outline)) {
        this.outline.material.linewidth = n;
      } else {
        this.material.linewidth = n;
      }
      return this;
    }

  };

  /**
   * Prototype for Two.Polygon
   */
  var PolyProto = {

    

  };

  _.extend(Two.Rectangle.prototype, ShapeProto, FillProto, StrokeProto);
  _.extend(Two.Circle.prototype, ShapeProto, FillProto, StrokeProto);
  _.extend(Two.Polygon.prototype, ShapeProto, FillProto, StrokeProto);
  _.extend(Two.Line.prototype, ShapeProto, StrokeProto);

  function fitToWindow() {

    var wr = document.body.getBoundingClientRect();

    var width = this.width = wr.width;
    var height = this.height = wr.height;

    this.renderer.setSize(width, height);

    this.camera.top = 0;
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.bottom = height;

    this.camera.updateProjectionMatrix();

    if (_.isFunction(this.__onResize)) {
      this.__onResize(width, height);
    }

  }

  function loop() {
    _.each(twos, function(two) {
      two.render();
    });
    requestAnimationFrame(loop);
  }

  loop();

  /**
   * Export
   */
  root['Two'] = Two;

})();