/* SkyMetric · comportamento da página */
(function () {
  "use strict";

  // WhatsApp da agência: só dígitos, com 55 e DDD.
  var WHATSAPP = "5535998965449";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document.documentElement;

  /* cabeçalho: transparente em cima da Terra, sólido depois */
  var top = document.querySelector("[data-top]");
  var onScroll = function () { top.classList.toggle("is-solid", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* menu no celular */
  var menu = document.querySelector("[data-menu]"), nav = document.querySelector("[data-nav]");
  var setMenu = function (open) {
    nav.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) top.classList.add("is-solid"); else onScroll();
  };
  menu.addEventListener("click", function () { setMenu(menu.getAttribute("aria-expanded") !== "true"); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* entrada suave: só no que ainda está abaixo da tela */
  if (!reduce && "IntersectionObserver" in window) {
    var els = document.querySelectorAll(".section .title, .section .lead, .pillars li, .card, .flight li, .metrics > div, .who li, .faq, .form");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    var any = false;
    els.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.setAttribute("data-reveal", ""); io.observe(el); any = true; }
    });
    if (any) doc.classList.add("js-motion");
  }

  /* ano no rodapé */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* formulário: monta a mensagem e abre o WhatsApp. Nada é enviado para servidor nenhum. */
  var form = document.querySelector("[data-form]");
  if (form) {
    var msg = form.querySelector("[data-form-msg]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      ["nome", "empresa", "verba"].forEach(function (n) {
        var f = form.elements[n], ok = f.value.trim() !== "";
        f.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !bad) bad = f;
      });
      if (bad) { msg.textContent = "Preencha nome, empresa e a faixa de investimento."; bad.focus(); return; }
      if (!WHATSAPP) { msg.textContent = "[CONFIRMAR] Falta cadastrar o número do WhatsApp no topo do main.js."; return; }
      msg.textContent = "";
      var linhas = [
        "Olá, SkyMetric. Quero um diagnóstico.",
        "Nome: " + form.elements.nome.value.trim(),
        "Empresa: " + form.elements.empresa.value.trim(),
        "Investimento mensal em anúncio: " + form.elements.verba.value
      ];
      var obj = form.elements.objetivo.value.trim();
      if (obj) linhas.push("O que quero resolver: " + obj);
      // evento de contato para o Pixel da Meta (só existe se o Pixel carregou)
      if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: "Diagnóstico pelo WhatsApp", content_category: form.elements.verba.value });
      window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(linhas.join("\n")), "_blank", "noopener");
    });
  }
})();
