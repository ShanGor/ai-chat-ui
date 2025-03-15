import {memo} from "react";

const RevealjsShow = memo(({slides}) => {
    const id = 'slide-' + Math.random()
    if (!slides) return <></>

    const renderSlides = () => {
        return `<html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.css">
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/theme/black.min.css" id="theme">
                    </head>
                    <body>
                      <div class="reveal">
                        <div class="slides">
                          ${slides}
                        </div>
                      </div>
                    
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.js"></script>
                        <script>
                            Reveal.initialize({
                              controls: true,
                              progress: true,
                              center: true,
                              hash: false,
                              history: false,
                              transition: 'slide',
                            });
                        </script>
                    </body>
                </html>`
    }

    return (<iframe src={`data:text/html;charset=utf-8,${encodeURIComponent(renderSlides())}`}
                    id={id} allowFullScreen={true}
                    style={{width: '100%', height: '50vh', background: '#191919'}}></iframe>);
})

export default RevealjsShow;