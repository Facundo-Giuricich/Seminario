// Obtiene el elemento del cuadro de texto (textarea) por su ID.
var cajaComentario = document.getElementById("cajaComentario");

// Agrega un "escuchador de eventos" que se activa cuando una tecla es presionada dentro del cuadro de texto.
cajaComentario.addEventListener("keydown", function (evento) {
    // Verifica si la tecla presionada fue "Enter".
    if (evento.key === "Enter") {
        // previene el comportamiento por defecto de la tecla enter (que es agregar una nueva linea)
        evento.preventDefault();
        // Obtiene el texto que está escrito en el cuadro de texto.
        const texto = cajaComentario.value;
        // Muestra una alerta en el navegador con el texto que se obtuvo.
        alert(texto);
    }
});

// Obtiene el botón para cambiar el color por su ID.
const btnCambiarColor = document.getElementById("btnCambiarColor");
// Declara una variable para llevar un registro del estado del color actual. Empieza en 0.
let estadoColor = 0;

// Agrega un "escuchador de eventos" que se activa cuando se hace clic en el botón.
btnCambiarColor.addEventListener("click", function () {
    // Incrementa el estado del color. El % 3 (módulo 3) asegura que el valor siempre esté entre 0, 1 y 2.
    // Si estadoColor es 2, (2 + 1) % 3 se convierte en 0, volviendo al inicio.
    estadoColor = (estadoColor + 1) % 3;

    // Una estructura 'switch' que cambia el color de fondo y el color del texto de la página
    // según el valor de 'estadoColor'.
    switch (estadoColor) {
        case 0: // Si estadoColor es 0
            document.body.style.backgroundColor = "white"; // Fondo blanco
            document.body.style.color = "black";           // Texto negro
            break;
        case 1: // Si estadoColor es 1
            document.body.style.backgroundColor = "black"; // Fondo negro
            document.body.style.color = "white";          // Texto blanco
            break;
        case 2: // Si estadoColor es 2
            document.body.style.backgroundColor = "lightblue"; // Fondo celeste
            document.body.style.color = "red";                 // Texto rojo
            break;
    }
});