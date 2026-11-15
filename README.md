# SkyMetric · site da agência

Página única, em HTML, CSS e JavaScript puros. Abre com duplo clique no `index.html` e publica em qualquer hospedagem estática.

## Arquivos
```
index.html     página
privacidade.html  política de privacidade
CNAME          domínio skymetric.com.br
styles.css     visual (escrito à mão, sem etapa de build)
main.js        menu, entrada das seções e formulário que abre o WhatsApp
earth.js       a Terra girando no topo (WebGL, sem biblioteca)
earth-tex.js   textura da Terra à noite, embutida (NASA Black Marble)
fonts/         Magistral, a fonte da marca (5 pesos, WOFF2)
assets/        logos, águia e elementos gráficos em SVG, ícones e og-image
```

## O que trocar
- **WhatsApp:** `WHATSAPP` no topo do `main.js`. Vazio, o formulário avisa em vez de abrir a conversa.
- **Velocidade e ângulo da Terra:** `TURN_SECONDS`, `LON0` e `TILT` no topo do `earth.js`.
- **Textos:** direto no `index.html`. Os trechos a confirmar estão marcados com `<!-- CONFIRMAR -->`.
- **Cases:** existe um bloco comentado no `index.html` esperando resultados reais de clientes.

## Publicação
- Domínio: `skymetric.com.br` (arquivo `CNAME`, que precisa ir em todo upload).
- Pixel da Meta `1868144297876380` no `<head>`: registra PageView e, no envio do formulário, o evento Lead.
- DNS na Hostinger: quatro registros A no `@` (185.199.108.153, .109.153, .110.153, .111.153) e CNAME `www` para `adrielabelo-web.github.io`. Não mexer nos registros MX, que são do e-mail.
- Ainda a conferir: licença de uso web da fonte Magistral (Adobe Fonts).

## Créditos
- Imagem da Terra: NASA Earth Observatory, Black Marble (domínio público).
- Logos, elementos e fonte: identidade visual da SkyMetric.
