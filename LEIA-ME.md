# mf+arquitetos — imagens contínuas

Revisão da proposta com a estrutura solicitada a partir da referência MOS: home curta, abertura em vídeo de ponta a ponta e projetos sem margens, bordas ou espaços entre as fotografias.

## Abrir

Extraia o ZIP inteiro e abra `index.html`. A navegação usa hash e os arquivos de imagem e vídeo estão incluídos. Não precisa de npm ou build.

Para desenvolvimento, use o Live Server do VS Code ou execute na pasta do projeto:

```bash
python -m http.server 8080
```

Abra `http://localhost:8080`. A fonte Archivo é carregada pelo Google Fonts, com fontes de sistema como alternativa.

## Estrutura

- **Início:** vídeo de abertura, quatro projetos em duas colunas contínuas, acesso ao portfólio completo e chamada breve para o escritório.
- **Projetos:** seis projetos reais, filtros por categoria e situação, busca por nome, cidade ou ano. Cada projeto abre uma página com ficha e galeria.
- **Escritório:** fotografia da equipe, história, frentes de atuação e princípios.
- **Contato:** apresentação breve, WhatsApp, e-mail, telefones, endereço e Instagram. Os links abrem os canais correspondentes; não há formulário ou serviço de envio.
- **Celular:** projetos em uma coluna, menu de navegação e imagens dos serviços nos acordeões.

O menu com fotografias, a transição horizontal com o sinal “+”, as revelações de títulos, o movimento suave nas imagens e a galeria continuam presentes.

## Vídeo da abertura

O vídeo incluído é uma **montagem demonstrativa com fotografias reais da Casa do Lago**, com aproximações e transições suaves. Não é filmagem da obra. Serve para avaliar a abertura enquanto o filme definitivo não é fornecido.

Há uma versão de 1920 × 1080 e outra de 960 × 540 para celular, ambas MP4/H.264, sem áudio, com aproximadamente 16 segundos. A reprodução usa o arquivo local e não depende de player externo.

O controle permite pausar ou reproduzir. O vídeo pausa quando sai da tela, ao abrir o menu, ao mudar de página ou ao ocultar a aba. Preferência por movimento reduzido ou economia de dados desativa o início automático. Se o navegador bloquear o autoplay, a fotografia permanece visível e o visitante pode iniciar manualmente.

Para trocar pelo filme definitivo, ajuste `HERO_VIDEO` em `js/data.js`:

```js
const HERO_VIDEO = {
  src: 'video/filme-oficial.mp4',
  mobileSrc: 'video/filme-oficial-mobile.mp4',
  poster: 'img/portfolio/casa-do-lago-01.webp'
};
```

`mobileSrc` é opcional. Use MP4/H.264 com o índice de reprodução no início do arquivo (`faststart`). Se o novo filme apresentar outros projetos, ajuste também a legenda e o link `.film-credit` no HTML. Ao trocar a imagem de abertura, atualize o preload e o pôster inicial no HTML para que já correspondam ao novo arquivo antes da execução do JavaScript.

## Conteúdo e imagens

Seleção de seis projetos do site oficial: Casa do Lago, Casa MCNY, Tartuferia San Paolo, Casa Celeiro, Casa Biblioteca e Casa das Jabuticabeiras, com seis imagens por projeto. A home destaca os quatro primeiros definidos em `HOME_FEATURED`.

As fotografias, perspectivas, marca e foto da equipe vieram do site da MF+. Fontes e créditos disponíveis estão em `FONTES.json`. As imagens têm arquivos WebP grandes e versões menores com o sufixo `-small`.

Casa Celeiro está identificada como perspectiva e em andamento conforme a página consultada. A área não foi incluída porque o valor da fonte estava malformado. Datas e situações reproduzem a fonte consultada, sem supor atualização da obra.

A seleção não inclui uma obra industrial: a seção dessa frente usa a fotografia da equipe. Os textos institucionais foram adaptados para a proposta e os contatos vieram da base enviada. Esta entrega apresenta uma seleção de portfólio, não a migração de todos os projetos do site atual.

## Onde ajustar

- `index.html`: páginas, textos institucionais, contatos e legenda da abertura.
- `js/data.js`: dados dos projetos, ordem da home (`HOME_FEATURED`), arquivos do vídeo (`HERO_VIDEO`) e dimensões das imagens (`IMAGE_SIZES`).
- `css/immersive.css`: direção visual desta revisão, incluindo hero, grade contínua, páginas e versões para celular. É carregado depois da base.
- `css/style.css`: estilos compartilhados, galeria, acordeões e animações da base.
- `js/site.js`: navegação, reprodução do vídeo, menu, filtros, revelações e galeria.
- `img/portfolio/` e `video/`: arquivos locais das imagens e vídeos.

Ao adicionar imagens, inclua suas dimensões em `IMAGE_SIZES` e uma versão `-small.webp` para o carregamento responsivo.

## Verificação

Conferidos: sintaxe JavaScript, referências de rotas e destaques, existência de recursos locais, IDs e vínculos de acessibilidade no HTML. Os dois vídeos foram decodificados para verificar a integridade dos arquivos.

A adaptação para desktop e celular está implementada. Esta revisão não passou por teste visual ou de interação no navegador. Nenhuma mudança foi publicada nos sites oficiais.
