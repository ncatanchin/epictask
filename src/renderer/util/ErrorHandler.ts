

function onException (err):void {
  console.error("Exception", err);
}


function onError (err):void {
  console.error("Uncaught", err);
}

function onRejection (err):void {
  console.error("Rejection", err);
}


process.on('uncaughtException', onException)
process.on('unhandledRejection', onRejection)
//process.on('error',onError)

if (typeof window !== 'undefined') {
  window.addEventListener('uncaughtException',onException)
  window.addEventListener('error',onError)
  window.addEventListener('unhandledrejection',onRejection)
  window.onunhandledrejection = onRejection
  window.onerror = onError
}

export {}
