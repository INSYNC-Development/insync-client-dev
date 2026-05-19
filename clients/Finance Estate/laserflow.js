/**
 * LaserFlow - Vanilla JavaScript WebGL Laser Effect
 * Multi-color version with core beam and dual glow colors
 *
 * Usage:
 *   const laser = new LaserFlow(document.getElementById('container'), {
 *     coreColor: '#FFFFFF',      // White core
 *     glowColor1: '#C39346',     // Primary glow (amber)
 *     glowColor2: '#954624',     // Secondary glow (deep orange/red)
 *     // ... other options
 *   });
 */

class LaserFlow {
  static VERT = `
  precision highp float;
  attribute vec3 position;
  void main(){
    gl_Position = vec4(position, 1.0);
  }
  `;

  static FRAG = `
  #ifdef GL_ES
  #extension GL_OES_standard_derivatives : enable
  #endif
  precision highp float;
  precision mediump int;
  
  uniform float iTime;
  uniform vec3 iResolution;
  uniform vec4 iMouse;
  uniform float uWispDensity;
  uniform float uTiltScale;
  uniform float uFlowTime;
  uniform float uFogTime;
  uniform float uBeamXFrac;
  uniform float uBeamYFrac;
  uniform float uFlowSpeed;
  uniform float uVLenFactor;
  uniform float uHLenFactor;
  uniform float uFogIntensity;
  uniform float uFogScale;
  uniform float uWSpeed;
  uniform float uWIntensity;
  uniform float uFlowStrength;
  uniform float uDecay;
  uniform float uFalloffStart;
  uniform float uFogFallSpeed;
  uniform vec3 uCoreColor;
  uniform vec3 uGlowColor1;
  uniform vec3 uGlowColor2;
  uniform float uFade;
  
  #define PI 3.14159265359
  #define TWO_PI 6.28318530718
  #define EPS 1e-6
  #define EDGE_SOFT (DT_LOCAL*4.0)
  #define DT_LOCAL 0.0038
  #define TAP_RADIUS 6
  #define R_H 150.0
  #define R_V 150.0
  #define FLARE_HEIGHT 16.0
  #define FLARE_AMOUNT 8.0
  #define FLARE_EXP 2.0
  #define TOP_FADE_START 0.1
  #define TOP_FADE_EXP 1.0
  #define FLOW_PERIOD 0.5
  #define FLOW_SHARPNESS 1.5
  
  #define W_BASE_X 1.5
  #define W_LAYER_GAP 0.25
  #define W_LANES 10
  #define W_SIDE_DECAY 0.5
  #define W_HALF 0.01
  #define W_AA 0.15
  #define W_CELL 20.0
  #define W_SEG_MIN 0.01
  #define W_SEG_MAX 0.55
  #define W_CURVE_AMOUNT 15.0
  #define W_CURVE_RANGE (FLARE_HEIGHT - 3.0)
  #define W_BOTTOM_EXP 10.0
  
  #define FOG_ON 1
  #define FOG_CONTRAST 1.2
  #define FOG_SPEED_U 0.1
  #define FOG_SPEED_V -0.1
  #define FOG_OCTAVES 5
  #define FOG_BOTTOM_BIAS 0.8
  #define FOG_TILT_TO_MOUSE 0.05
  #define FOG_TILT_DEADZONE 0.01
  #define FOG_TILT_MAX_X 0.35
  #define FOG_TILT_SHAPE 1.5
  #define FOG_BEAM_MIN 0.0
  #define FOG_BEAM_MAX 0.75
  #define FOG_MASK_GAMMA 0.5
  #define FOG_EXPAND_SHAPE 12.2
  #define FOG_EDGE_MIX 0.5
  
  #define HFOG_EDGE_START 0.20
  #define HFOG_EDGE_END 0.98
  #define HFOG_EDGE_GAMMA 1.4
  #define HFOG_Y_RADIUS 25.0
  #define HFOG_Y_SOFT 60.0
  
  #define EDGE_X0 0.22
  #define EDGE_X1 0.995
  #define EDGE_X_GAMMA 1.25
  #define EDGE_LUMA_T0 0.0
  #define EDGE_LUMA_T1 2.0
  #define DITHER_STRENGTH 1.0
  
  // Core intensity threshold for color blending
  #define CORE_THRESHOLD 0.6
  #define GLOW1_THRESHOLD 0.25
  
  float g(float x){return x<=0.00031308?12.92*x:1.055*pow(x,1.0/2.4)-0.055;}
  float bs(vec2 p,vec2 q,float powr){
      float d=distance(p,q),f=powr*uFalloffStart,r=(f*f)/(d*d+EPS);
      return powr*min(1.0,r);
  }
  float bsa(vec2 p,vec2 q,float powr,vec2 s){
      vec2 d=p-q; float dd=(d.x*d.x)/(s.x*s.x)+(d.y*d.y)/(s.y*s.y),f=powr*uFalloffStart,r=(f*f)/(dd+EPS);
      return powr*min(1.0,r);
  }
  float tri01(float x){float f=fract(x);return 1.0-abs(f*2.0-1.0);}
  float tauWf(float t,float tmin,float tmax){float a=smoothstep(tmin,tmin+EDGE_SOFT,t),b=1.0-smoothstep(tmax-EDGE_SOFT,tmax,t);return max(0.0,a*b);} 
  float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+34.123);return fract(p.x*p.y);}
  float vnoise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      float a=h21(i),b=h21(i+vec2(1,0)),c=h21(i+vec2(0,1)),d=h21(i+vec2(1,1));
      vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
  }
  float fbm2(vec2 p){
      float v=0.0,amp=0.6; mat2 m=mat2(0.86,0.5,-0.5,0.86);
      for(int i=0;i<FOG_OCTAVES;++i){v+=amp*vnoise(p); p=m*p*2.03+17.1; amp*=0.52;}
      return v;
  }
  float rGate(float x,float l){float a=smoothstep(0.0,W_AA,x),b=1.0-smoothstep(l,l+W_AA,x);return max(0.0,a*b);}
  float flareY(float y){float t=clamp(1.0-(clamp(y,0.0,FLARE_HEIGHT)/max(FLARE_HEIGHT,EPS)),0.0,1.0);return pow(t,FLARE_EXP);}
  
  float vWisps(vec2 uv,float topF){
      float y=uv.y,yf=(y+uFlowTime*uWSpeed)/W_CELL;
      float dRaw=clamp(uWispDensity,0.0,2.0),d=dRaw<=0.0?1.0:dRaw;
      float lanesF=floor(float(W_LANES)*min(d,1.0)+0.5);
      int lanes=int(max(1.0,lanesF));
      float sp=min(d,1.0),ep=max(d-1.0,0.0);
      float fm=flareY(max(y,0.0)),rm=clamp(1.0-(y/max(W_CURVE_RANGE,EPS)),0.0,1.0),cm=fm*rm;
      const float G=0.05; float xS=1.0+(FLARE_AMOUNT*W_CURVE_AMOUNT*G)*cm;
      float sPix=clamp(y/R_V,0.0,1.0),bGain=pow(1.0-sPix,W_BOTTOM_EXP),sum=0.0;
      for(int s=0;s<2;++s){
          float sgn=s==0?-1.0:1.0;
          for(int i=0;i<W_LANES;++i){
              if(i>=lanes) break;
              float off=W_BASE_X+float(i)*W_LAYER_GAP,xc=sgn*(off*xS);
              float dx=abs(uv.x-xc),lat=1.0-smoothstep(W_HALF,W_HALF+W_AA,dx),amp=exp(-off*W_SIDE_DECAY);
              float seed=h21(vec2(off,sgn*17.0)),yf2=yf+seed*7.0,ci=floor(yf2),fy=fract(yf2);
              float seg=mix(W_SEG_MIN,W_SEG_MAX,h21(vec2(ci,off*2.3)));
              float spR=h21(vec2(ci,off+sgn*31.0)),seg1=rGate(fy,seg)*step(spR,sp);
              if(ep>0.0){float spR2=h21(vec2(ci*3.1+7.0,off*5.3+sgn*13.0)); float f2=fract(fy+0.5); seg1+=rGate(f2,seg*0.9)*step(spR2,ep);}
              sum+=amp*lat*seg1;
          }
      }
      float span=smoothstep(-3.0,0.0,y)*(1.0-smoothstep(R_V-6.0,R_V,y));
      return uWIntensity*sum*topF*bGain*span;
  }
  
  // Multi-color blending function
  vec3 getMultiColor(float intensity, float wispIntensity) {
      // Normalize intensity for color selection
      float totalIntensity = intensity + wispIntensity * 0.3;
      
      // Core (brightest areas) - white/core color
      float coreAmount = smoothstep(CORE_THRESHOLD, 1.0, totalIntensity);
      
      // Primary glow (medium intensity)
      float glow1Amount = smoothstep(GLOW1_THRESHOLD, CORE_THRESHOLD, totalIntensity) * (1.0 - coreAmount);
      
      // Secondary glow (outer/dimmer areas)
      float glow2Amount = smoothstep(0.0, GLOW1_THRESHOLD, totalIntensity) * (1.0 - glow1Amount - coreAmount);
      
      // Blend colors based on intensity zones
      vec3 result = uGlowColor2 * glow2Amount;
      result += uGlowColor1 * glow1Amount;
      result += uCoreColor * coreAmount;
      
      // Apply overall intensity
      return result * intensity;
  }
  
  void mainImage(out vec4 fc,in vec2 frag){
      vec2 C=iResolution.xy*.5; float invW=1.0/max(C.x,1.0);
      float sc=512.0/iResolution.x*.4;
      vec2 uv=(frag-C)*sc,off=vec2(uBeamXFrac*iResolution.x*sc,uBeamYFrac*iResolution.y*sc);
      vec2 uvc = uv - off;
      float a=0.0,b=0.0;
      float basePhase=1.5*PI+uDecay*.5; float tauMin=basePhase-uDecay; float tauMax=basePhase;
      float cx=clamp(uvc.x/(R_H*uHLenFactor),-1.0,1.0),tH=clamp(TWO_PI-acos(cx),tauMin,tauMax);
      for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){
          float tu=tH+float(k)*DT_LOCAL,wt=tauWf(tu,tauMin,tauMax); if(wt<=0.0) continue;
          float spd=max(abs(sin(tu)),0.02),u=clamp((basePhase-tu)/max(uDecay,EPS),0.0,1.0),env=pow(1.0-abs(u*2.0-1.0),0.8);
          vec2 p=vec2((R_H*uHLenFactor)*cos(tu),0.0);
          a+=wt*bs(uvc,p,env*spd);
      }
      float yPix=uvc.y,cy=clamp(-yPix/(R_V*uVLenFactor),-1.0,1.0),tV=clamp(TWO_PI-acos(cy),tauMin,tauMax);
      for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){
          float tu=tV+float(k)*DT_LOCAL,wt=tauWf(tu,tauMin,tauMax); if(wt<=0.0) continue;
          float yb=(-R_V)*cos(tu),s=clamp(yb/R_V,0.0,1.0),spd=max(abs(sin(tu)),0.02);
          float env=pow(1.0-s,0.6)*spd;
          float cap=1.0-smoothstep(TOP_FADE_START,1.0,s); cap=pow(cap,TOP_FADE_EXP); env*=cap;
          float ph=s/max(FLOW_PERIOD,EPS)+uFlowTime*uFlowSpeed;
          float fl=pow(tri01(ph),FLOW_SHARPNESS);
          env*=mix(1.0-uFlowStrength,1.0,fl);
          float yp=(-R_V*uVLenFactor)*cos(tu),m=pow(smoothstep(FLARE_HEIGHT,0.0,yp),FLARE_EXP),wx=1.0+FLARE_AMOUNT*m;
          vec2 sig=vec2(wx,1.0),p=vec2(0.0,yp);
          float mask=step(0.0,yp);
          b+=wt*bsa(uvc,p,mask*env,sig);
      }
      float sPix=clamp(yPix/R_V,0.0,1.0),topA=pow(1.0-smoothstep(TOP_FADE_START,1.0,sPix),TOP_FADE_EXP);
      float L=a+b*topA;
      float w=vWisps(vec2(uvc.x,yPix),topA);
      float fog=0.0;
  #if FOG_ON
      vec2 fuv=uvc*uFogScale;
      float mAct=step(1.0,length(iMouse.xy)),nx=((iMouse.x-C.x)*invW)*mAct;
      float ax = abs(nx);
      float stMag = mix(ax, pow(ax, FOG_TILT_SHAPE), 0.35);
      float st = sign(nx) * stMag * uTiltScale;
      st = clamp(st, -FOG_TILT_MAX_X, FOG_TILT_MAX_X);
      vec2 dir=normalize(vec2(st,1.0));
      fuv+=uFogTime*uFogFallSpeed*dir;
      vec2 prp=vec2(-dir.y,dir.x);
      fuv+=prp*(0.08*sin(dot(uvc,prp)*0.08+uFogTime*0.9));
      float n=fbm2(fuv+vec2(fbm2(fuv+vec2(7.3,2.1)),fbm2(fuv+vec2(-3.7,5.9)))*0.6);
      n=pow(clamp(n,0.0,1.0),FOG_CONTRAST);
      float pixW = 1.0 / max(iResolution.y, 1.0);
  #ifdef GL_OES_standard_derivatives
      float wL = max(fwidth(L), pixW);
  #else
      float wL = pixW;
  #endif
      float m0=pow(smoothstep(FOG_BEAM_MIN - wL, FOG_BEAM_MAX + wL, L),FOG_MASK_GAMMA);
      float bm=1.0-pow(1.0-m0,FOG_EXPAND_SHAPE); bm=mix(bm*m0,bm,FOG_EDGE_MIX);
      float yP=1.0-smoothstep(HFOG_Y_RADIUS,HFOG_Y_RADIUS+HFOG_Y_SOFT,abs(yPix));
      float nxF=abs((frag.x-C.x)*invW),hE=1.0-smoothstep(HFOG_EDGE_START,HFOG_EDGE_END,nxF); hE=pow(clamp(hE,0.0,1.0),HFOG_EDGE_GAMMA);
      float hW=mix(1.0,hE,clamp(yP,0.0,1.0));
      float bBias=mix(1.0,1.0-sPix,FOG_BOTTOM_BIAS);
      float browserFogIntensity = uFogIntensity;
      browserFogIntensity *= 1.8;
      float radialFade = 1.0 - smoothstep(0.0, 0.7, length(uvc) / 120.0);
      float safariFog = n * browserFogIntensity * bBias * bm * hW * radialFade;
      fog = safariFog;
  #endif
      float LF=L+fog;
      float dith=(h21(frag)-0.5)*(DITHER_STRENGTH/255.0);
      
      // Apply multi-color gradient based on intensity
      float totalIntensity = LF + w;
      vec3 multiColor = getMultiColor(g(LF), w);
      
      // Add wisps with glow color blend
      float wispGamma = g(w);
      vec3 wispColor = mix(uGlowColor1, uCoreColor, smoothstep(0.0, 0.5, w));
      multiColor += wispColor * wispGamma;
      
      vec3 col = multiColor + dith;
      
      float alpha=clamp(g(L+w*0.6)+dith*0.6,0.0,1.0);
      float nxE=abs((frag.x-C.x)*invW),xF=pow(clamp(1.0-smoothstep(EDGE_X0,EDGE_X1,nxE),0.0,1.0),EDGE_X_GAMMA);
      float scene=LF+max(0.0,w)*0.5,hi=smoothstep(EDGE_LUMA_T0,EDGE_LUMA_T1,scene);
      float eM=mix(xF,1.0,hi);
      col*=eM; alpha*=eM;
      col*=uFade; alpha*=uFade;
      fc=vec4(col,alpha);
  }
  
  void main(){
    vec4 fc;
    mainImage(fc, gl_FragCoord.xy);
    gl_FragColor = fc;
  }
  `;

  static defaultOptions = {
    wispDensity: 1,
    dpr: null,
    mouseSmoothTime: 0.0,
    mouseTiltStrength: 0.01,
    horizontalBeamOffset: 0.1,
    verticalBeamOffset: 0.0,
    flowSpeed: 0.35,
    verticalSizing: 2.0,
    horizontalSizing: 0.5,
    fogIntensity: 0.45,
    fogScale: 0.3,
    wispSpeed: 15.0,
    wispIntensity: 5.0,
    flowStrength: 0.25,
    decay: 1.1,
    falloffStart: 1.2,
    fogFallSpeed: 0.6,
    // Multi-color options
    coreColor: "#FFFFFF", // Bright white core
    glowColor1: "#C39346", // Primary glow (amber)
    glowColor2: "#954624", // Secondary glow (deep orange/red)
  };

  constructor(container, options = {}) {
    this.container = container;
    this.options = { ...LaserFlow.defaultOptions, ...options };

    // State
    this.hasFaded = false;
    this.fade = 0;
    this.paused = false;
    this.inView = true;
    this.rect = null;
    this.baseDpr = 1;
    this.currentDpr = 1;
    this.lastSize = { width: 0, height: 0, dpr: 0 };
    this.fpsSamples = [];
    this.lastFpsCheck = performance.now();
    this.emaDt = 16.7;
    this.lastDprChange = 0;
    this.prevTime = 0;
    this.flowTime = 0;
    this.fogTime = 0;

    // Mouse tracking
    this.mouseTarget = { x: 0, y: 0 };
    this.mouseSmooth = { x: 0, y: 0 };

    // RAF handle
    this.rafId = 0;
    this.resizeRafId = 0;

    // Bound methods
    this._onResize = this._scheduleResize.bind(this);
    this._onVisibilityChange = this._handleVisibilityChange.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerLeave = this._handlePointerLeave.bind(this);
    this._onContextLost = this._handleContextLost.bind(this);
    this._onContextRestored = this._handleContextRestored.bind(this);
    this._animate = this._animate.bind(this);

    this._init();
  }

  _hexToRGB(hex) {
    let c = hex.trim();
    if (c[0] === "#") c = c.slice(1);
    if (c.length === 3) {
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    }
    const n = parseInt(c, 16) || 0xffffff;
    return {
      r: ((n >> 16) & 255) / 255,
      g: ((n >> 8) & 255) / 255,
      b: (n & 255) / 255,
    };
  }

  _createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  _createProgram(gl, vertSource, fragSource) {
    const vertShader = this._createShader(gl, gl.VERTEX_SHADER, vertSource);
    const fragShader = this._createShader(gl, gl.FRAGMENT_SHADER, fragSource);

    if (!vertShader || !fragShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);

    return program;
  }

  _init() {
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    this.container.appendChild(this.canvas);

    const contextOptions = {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
    };

    this.gl =
      this.canvas.getContext("webgl", contextOptions) ||
      this.canvas.getContext("experimental-webgl", contextOptions);

    if (!this.gl) {
      console.error("WebGL not supported");
      return;
    }

    const gl = this.gl;

    gl.getExtension("OES_standard_derivatives");

    this.baseDpr = Math.min(
      this.options.dpr ?? (window.devicePixelRatio || 1),
      2
    );
    this.currentDpr = this.baseDpr;

    this.program = this._createProgram(gl, LaserFlow.VERT, LaserFlow.FRAG);
    if (!this.program) return;

    gl.useProgram(this.program);

    const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    this.uniforms = {
      iTime: gl.getUniformLocation(this.program, "iTime"),
      iResolution: gl.getUniformLocation(this.program, "iResolution"),
      iMouse: gl.getUniformLocation(this.program, "iMouse"),
      uWispDensity: gl.getUniformLocation(this.program, "uWispDensity"),
      uTiltScale: gl.getUniformLocation(this.program, "uTiltScale"),
      uFlowTime: gl.getUniformLocation(this.program, "uFlowTime"),
      uFogTime: gl.getUniformLocation(this.program, "uFogTime"),
      uBeamXFrac: gl.getUniformLocation(this.program, "uBeamXFrac"),
      uBeamYFrac: gl.getUniformLocation(this.program, "uBeamYFrac"),
      uFlowSpeed: gl.getUniformLocation(this.program, "uFlowSpeed"),
      uVLenFactor: gl.getUniformLocation(this.program, "uVLenFactor"),
      uHLenFactor: gl.getUniformLocation(this.program, "uHLenFactor"),
      uFogIntensity: gl.getUniformLocation(this.program, "uFogIntensity"),
      uFogScale: gl.getUniformLocation(this.program, "uFogScale"),
      uWSpeed: gl.getUniformLocation(this.program, "uWSpeed"),
      uWIntensity: gl.getUniformLocation(this.program, "uWIntensity"),
      uFlowStrength: gl.getUniformLocation(this.program, "uFlowStrength"),
      uDecay: gl.getUniformLocation(this.program, "uDecay"),
      uFalloffStart: gl.getUniformLocation(this.program, "uFalloffStart"),
      uFogFallSpeed: gl.getUniformLocation(this.program, "uFogFallSpeed"),
      uCoreColor: gl.getUniformLocation(this.program, "uCoreColor"),
      uGlowColor1: gl.getUniformLocation(this.program, "uGlowColor1"),
      uGlowColor2: gl.getUniformLocation(this.program, "uGlowColor2"),
      uFade: gl.getUniformLocation(this.program, "uFade"),
    };

    this._updateUniforms();

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);

    this._setSizeNow();

    this._setupObservers();
    this._setupEventListeners();

    this.startTime = performance.now() / 1000;
    this._animate();
  }

  _updateUniforms() {
    const gl = this.gl;
    const opts = this.options;

    gl.uniform1f(this.uniforms.uWispDensity, opts.wispDensity);
    gl.uniform1f(this.uniforms.uTiltScale, opts.mouseTiltStrength);
    gl.uniform1f(this.uniforms.uBeamXFrac, opts.horizontalBeamOffset);
    gl.uniform1f(this.uniforms.uBeamYFrac, opts.verticalBeamOffset);
    gl.uniform1f(this.uniforms.uFlowSpeed, opts.flowSpeed);
    gl.uniform1f(this.uniforms.uVLenFactor, opts.verticalSizing);
    gl.uniform1f(this.uniforms.uHLenFactor, opts.horizontalSizing);
    gl.uniform1f(this.uniforms.uFogIntensity, opts.fogIntensity);
    gl.uniform1f(this.uniforms.uFogScale, opts.fogScale);
    gl.uniform1f(this.uniforms.uWSpeed, opts.wispSpeed);
    gl.uniform1f(this.uniforms.uWIntensity, opts.wispIntensity);
    gl.uniform1f(this.uniforms.uFlowStrength, opts.flowStrength);
    gl.uniform1f(this.uniforms.uDecay, opts.decay);
    gl.uniform1f(this.uniforms.uFalloffStart, opts.falloffStart);
    gl.uniform1f(this.uniforms.uFogFallSpeed, opts.fogFallSpeed);

    // Set multi-color uniforms
    const core = this._hexToRGB(opts.coreColor || "#FFFFFF");
    gl.uniform3f(this.uniforms.uCoreColor, core.r, core.g, core.b);

    const glow1 = this._hexToRGB(opts.glowColor1 || "#C39346");
    gl.uniform3f(this.uniforms.uGlowColor1, glow1.r, glow1.g, glow1.b);

    const glow2 = this._hexToRGB(opts.glowColor2 || "#954624");
    gl.uniform3f(this.uniforms.uGlowColor2, glow2.r, glow2.g, glow2.b);
  }

  _setSizeNow() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const pr = this.currentDpr;

    const last = this.lastSize;
    const sizeChanged =
      Math.abs(w - last.width) > 0.5 || Math.abs(h - last.height) > 0.5;
    const dprChanged = Math.abs(pr - last.dpr) > 0.01;

    if (!sizeChanged && !dprChanged) return;

    this.lastSize = { width: w, height: h, dpr: pr };

    this.canvas.width = Math.floor(w * pr);
    this.canvas.height = Math.floor(h * pr);

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform3f(
      this.uniforms.iResolution,
      this.canvas.width,
      this.canvas.height,
      pr
    );

    this.rect = this.canvas.getBoundingClientRect();

    if (!this.paused) {
      this._render();
    }
  }

  _scheduleResize() {
    if (this.resizeRafId) cancelAnimationFrame(this.resizeRafId);
    this.resizeRafId = requestAnimationFrame(() => this._setSizeNow());
  }

  _setupObservers() {
    this.resizeObserver = new ResizeObserver(() => this._scheduleResize());
    this.resizeObserver.observe(this.container);

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        this.inView = entries[0]?.isIntersecting ?? true;
      },
      { root: null, threshold: 0 }
    );
    this.intersectionObserver.observe(this.container);
  }

  _setupEventListeners() {
    document.addEventListener("visibilitychange", this._onVisibilityChange, {
      passive: true,
    });

    this.canvas.addEventListener("pointermove", this._onPointerMove, {
      passive: true,
    });
    this.canvas.addEventListener("pointerdown", this._onPointerMove, {
      passive: true,
    });
    this.canvas.addEventListener("pointerenter", this._onPointerMove, {
      passive: true,
    });
    this.canvas.addEventListener("pointerleave", this._onPointerLeave, {
      passive: true,
    });

    this.canvas.addEventListener(
      "webglcontextlost",
      this._onContextLost,
      false
    );
    this.canvas.addEventListener(
      "webglcontextrestored",
      this._onContextRestored,
      false
    );
  }

  _handleVisibilityChange() {
    this.paused = document.hidden;
  }

  _handlePointerMove(event) {
    if (!this.rect) return;
    const x = event.clientX - this.rect.left;
    const y = event.clientY - this.rect.top;
    const hb = this.rect.height * this.currentDpr;
    this.mouseTarget.x = x * this.currentDpr;
    this.mouseTarget.y = hb - y * this.currentDpr;
  }

  _handlePointerLeave() {
    this.mouseTarget.x = 0;
    this.mouseTarget.y = 0;
  }

  _handleContextLost(event) {
    event.preventDefault();
    this.paused = true;
  }

  _handleContextRestored() {
    this.paused = false;
    this._scheduleResize();
  }

  _clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _adjustDprIfNeeded(now) {
    const elapsed = now - this.lastFpsCheck;
    if (elapsed < 750) return;

    const samples = this.fpsSamples;
    if (samples.length === 0) {
      this.lastFpsCheck = now;
      return;
    }

    const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;

    const dprFloor = 0.6;
    const lowerThresh = 50;
    const upperThresh = 58;
    const dprChangeCooldown = 2000;

    let next = this.currentDpr;
    const base = this.baseDpr;

    if (avgFps < lowerThresh) {
      next = this._clamp(this.currentDpr * 0.85, dprFloor, base);
    } else if (avgFps > upperThresh && this.currentDpr < base) {
      next = this._clamp(this.currentDpr * 1.1, dprFloor, base);
    }

    if (
      Math.abs(next - this.currentDpr) > 0.01 &&
      now - this.lastDprChange > dprChangeCooldown
    ) {
      this.currentDpr = next;
      this.lastDprChange = now;
      this._setSizeNow();
    }

    this.fpsSamples = [];
    this.lastFpsCheck = now;
  }

  _render() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  _animate() {
    this.rafId = requestAnimationFrame(this._animate);

    if (this.paused || !this.inView) return;

    const now = performance.now();
    const t = now / 1000 - this.startTime;
    const dt = Math.max(0, t - this.prevTime);
    this.prevTime = t;

    const dtMs = dt * 1000;
    this.emaDt = this.emaDt * 0.9 + dtMs * 0.1;
    const instFps = 1000 / Math.max(1, this.emaDt);
    this.fpsSamples.push(instFps);

    const gl = this.gl;

    gl.uniform1f(this.uniforms.iTime, t);

    const cdt = Math.min(0.033, Math.max(0.001, dt));
    this.flowTime += cdt;
    this.fogTime += cdt;
    gl.uniform1f(this.uniforms.uFlowTime, this.flowTime);
    gl.uniform1f(this.uniforms.uFogTime, this.fogTime);

    if (!this.hasFaded) {
      const fadeDur = 1.0;
      this.fade = Math.min(1, this.fade + cdt / fadeDur);
      gl.uniform1f(this.uniforms.uFade, this.fade);
      if (this.fade >= 1) this.hasFaded = true;
    }

    const tau = Math.max(1e-3, this.options.mouseSmoothTime);
    const alpha = 1 - Math.exp(-cdt / tau);
    this.mouseSmooth.x = this._lerp(
      this.mouseSmooth.x,
      this.mouseTarget.x,
      alpha
    );
    this.mouseSmooth.y = this._lerp(
      this.mouseSmooth.y,
      this.mouseTarget.y,
      alpha
    );
    gl.uniform4f(
      this.uniforms.iMouse,
      this.mouseSmooth.x,
      this.mouseSmooth.y,
      0,
      0
    );

    this._render();

    this._adjustDprIfNeeded(now);
  }

  /**
   * Update options dynamically
   * @param {Object} newOptions - Partial options to update
   */
  setOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    if (this.gl && this.program) {
      this.gl.useProgram(this.program);
      this._updateUniforms();
    }
  }

  /**
   * Destroy the LaserFlow instance and clean up resources
   */
  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.resizeRafId) cancelAnimationFrame(this.resizeRafId);

    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.intersectionObserver) this.intersectionObserver.disconnect();

    document.removeEventListener("visibilitychange", this._onVisibilityChange);

    if (this.canvas) {
      this.canvas.removeEventListener("pointermove", this._onPointerMove);
      this.canvas.removeEventListener("pointerdown", this._onPointerMove);
      this.canvas.removeEventListener("pointerenter", this._onPointerMove);
      this.canvas.removeEventListener("pointerleave", this._onPointerLeave);
      this.canvas.removeEventListener("webglcontextlost", this._onContextLost);
      this.canvas.removeEventListener(
        "webglcontextrestored",
        this._onContextRestored
      );
    }

    if (this.gl) {
      if (this.buffer) this.gl.deleteBuffer(this.buffer);
      if (this.program) this.gl.deleteProgram(this.program);

      const ext = this.gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    }

    if (this.canvas && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
    }

    this.gl = null;
    this.canvas = null;
    this.program = null;
    this.buffer = null;
    this.uniforms = null;
  }
}

export { LaserFlow };
export default LaserFlow;
