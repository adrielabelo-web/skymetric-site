/* SkyMetric · a Terra girando no topo da página.
   WebGL puro, sem biblioteca: um shader desenha a esfera, a textura noturna da NASA, a atmosfera,
   o sol atrás do horizonte e as estrelas.
   - Sem WebGL: o CSS mostra um horizonte parado (.no-gl).
   - Se o navegador derrubar o contexto (acontece em celular com pouca memória), a página volta para o
     horizonte parado e tenta religar o globo quando o contexto é devolvido.
   - Com "reduzir movimento" ligado: desenha um quadro só e para. */
(function () {
  "use strict";
  var canvas = document.querySelector("[data-earth]");
  if (!canvas) return;
  var hero = canvas.closest(".hero");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gl = null;
  try { gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }); } catch (e) {}
  if (!gl || !window.SKY_EARTH_TEX) { hero.classList.add("no-gl"); return; }

  // Para onde a câmera olha e a velocidade: o Brasil passa pelo centro logo no começo.
  // Uma volta completa leva 4 minutos. Para girar mais rápido, diminua TURN_SECONDS.
  var LON0 = -0.55, TILT = 1.02, TURN_SECONDS = 240;

  var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  var FS = [
    "precision highp float;",
    "uniform vec2 u_res,u_c,u_sun;uniform float u_r,u_t,u_lon,u_tilt,u_px;uniform sampler2D u_tex;",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "void main(){",
    "  vec2 f=gl_FragCoord.xy;vec2 p=(f-u_c)/u_r;float d=dot(p,p);float rad=sqrt(d);",
    // espaço + estrelas
    "  vec3 sp=vec3(.016,.022,.036);",
    "  float cs=5.*u_px;vec2 cell=floor(f/cs);float s=hash(cell);",
    "  if(s>.9955){float b=(s-.9955)/.0045;vec2 fc=fract(f/cs)-.5;float tw=.65+.35*sin(u_t*1.3+s*97.);sp+=vec3(.85,.92,1.)*b*tw*smoothstep(.42,.0,length(fc));}",
    // sol atrás do horizonte
    "  float sd=length(f-u_sun)/u_res.y;",
    "  vec3 sun=vec3(1.,.93,.82)*pow(.016/(sd+.016),2.2)+vec3(.24,.5,1.)*(.06/(sd+.06))*.5;",
    "  float sunNear=exp(-abs(f.x-u_sun.x)/(u_res.x*.30));",
    // atmosfera por fora do disco
    "  float atm=exp(-(rad-1.)*u_r/(u_res.y*.030));",
    "  sp+=sun+vec3(.16,.42,1.)*atm*(.35+1.1*sunNear)*step(1.,rad);",
    "  vec3 col=sp;",
    "  if(d<1.){",
    "    float z=sqrt(1.-d);vec3 n=vec3(p,z);",
    "    float ct=cos(u_tilt),st=sin(u_tilt);",
    "    vec3 m=vec3(n.x,n.y*ct-n.z*st,n.y*st+n.z*ct);",
    "    float lon=atan(m.x,m.z)+u_lon;float lat=asin(clamp(m.y,-1.,1.));",
    "    vec2 uv=vec2(lon/6.2831853+.5,lat/3.14159265+.5);",
    "    vec3 tx=texture2D(u_tex,uv).rgb;",
    // luz de cidade: na textura ela é alaranjada (vermelho acima do azul)
    "    float lights=clamp((tx.r-tx.b*.80)*5.,0.,1.);",
    "    vec3 c=tx*vec3(.92,1.08,1.42)*1.35+vec3(1.,.70,.32)*lights*2.8;",
    "    float rim=1.-z;",
    "    c+=vec3(.08,.30,1.)*pow(rim,5.5)*(.40+1.3*sunNear);",
    "    c=mix(c,vec3(.62,.80,1.),pow(rim,14.)*sunNear*.85);",
    "    c+=sun*.20;",
    "    float edge=clamp((1.-rad)*u_r/(1.5*u_px),0.,1.);",
    "    col=mix(sp+vec3(.16,.42,1.)*(.35+1.1*sunNear),c,edge);",
    "  }",
    "  gl_FragColor=vec4(col,1.);",
    "}"
  ].join("\n");

  var U = {}, W = 0, H = 0, px = 1, ready = false, visible = true, raf = 0, t0 = performance.now();
  var img = new Image(), imgOk = false;

  function fail() { ready = false; hero.classList.remove("has-earth"); hero.classList.add("no-gl"); }
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }

  function resize() {
    var r = hero.getBoundingClientRect();
    px = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(r.width * px)); H = Math.max(1, Math.round(r.height * px));
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    var mobile = r.width < 700;
    var horizon = H * (mobile ? 0.70 : 0.64);           // distância do topo até a linha do horizonte
    var radius = Math.max(W * (mobile ? 1.25 : 0.70), H * 0.95);
    gl.uniform2f(U.u_res, W, H);
    gl.uniform2f(U.u_c, W / 2, H - (horizon + radius));
    gl.uniform2f(U.u_sun, W / 2, H - horizon + H * 0.004);
    gl.uniform1f(U.u_r, radius);
    gl.uniform1f(U.u_px, px);
    gl.uniform1f(U.u_tilt, TILT);
  }
  function draw(now) {
    var t = (now - t0) / 1000;
    gl.uniform1f(U.u_t, t);
    gl.uniform1f(U.u_lon, LON0 - t * (Math.PI * 2 / TURN_SECONDS));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function loop(now) { if (!ready) { raf = 0; return; } draw(now); raf = (visible && !reduce) ? requestAnimationFrame(loop) : 0; }
  function start() { if (!raf && ready && visible && !reduce) raf = requestAnimationFrame(loop); }

  // monta tudo que vive dentro do contexto: programa, quadrado de tela cheia e textura
  function boot() {
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return fail();
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fail();
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["u_res", "u_c", "u_sun", "u_r", "u_t", "u_lon", "u_tilt", "u_px", "u_tex"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.u_tex, 0);
    if (gl.isContextLost()) return fail();
    ready = true; resize(); draw(performance.now());
    hero.classList.remove("no-gl"); hero.classList.add("has-earth");
    start();
  }

  img.onload = function () { imgOk = true; boot(); };
  img.onerror = fail;
  img.src = window.SKY_EARTH_TEX;

  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; fail(); });
  canvas.addEventListener("webglcontextrestored", function () { if (imgOk) boot(); });

  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (ready) { resize(); draw(performance.now()); } }, 120); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", function () { visible = !document.hidden; if (visible) start(); });
})();
