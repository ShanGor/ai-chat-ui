export const fetchEvents = (url, textConsumer, data=null, headers={}, method='POST') => {
    fetch(url, {
      method: method,
      headers: {...headers,
         'Content-Type': 'text/event-stream;chartset=UTF-8',
         'Connection': 'keep-alive',
         'Cache-Control': 'no-cache'
        },
      body: data
    })
    .then(response => {
      const reader = response.body.getReader()
      const textDecoder = new TextDecoder()
      const readChunk = () => {
        reader.read().then(({ value, done }) => {
          if (done) { 
            return
          }
          const text = textDecoder.decode(value)
          if (text.startsWith('event:')) { 
            textConsumer(text.substring('event:'.length))
          } else if (text.startsWith('data:')) { 
            textConsumer(text.substring('data:'.length))
          } else {
            textConsumer(text)
          }
          
          readChunk()
        }).catch(error => {
          console.error(error)
        })
      }
      readChunk()
    })
  }