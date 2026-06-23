let modelo;
let grafico;

// esta función se ejecuta cuando hago click en "Entrenar Modelo"
async function entrenarModelo() {

    // acá voy a guardar los valores de pérdida (loss)
    // de cada época para después graficarlos
    const historialLoss = [];

    // creo los datos de entrenamiento
    // básicamente le enseño al modelo que:
    // si entra 1 sale 2
    // si entra 2 sale 4
    // si entra 3 sale 6
    // o sea aprende la relación y = 2x
    const xs = tf.tensor2d([
        [1],
        [2],
        [3],
        [4],
        [5]
    ]);

    const ys = tf.tensor2d([
        [2],
        [4],
        [6],
        [8],
        [10]
    ]);

    // creo el modelo secuencial
    // secuencial significa que las capas se ejecutan una detrás de otra
    modelo = tf.sequential();

    // agrego una capa neuronal
    // units:1 significa una neurona
    // inputShape:[1] significa que recibe un solo valor de entrada
    modelo.add(
        tf.layers.dense({
            units: 1,
            inputShape: [1]
        })
    );

    // acá preparo el modelo para entrenarlo
    modelo.compile({

        // optimizer:
        // se encarga de ajustar los pesos del modelo
        // para que cada vez cometa menos error
        optimizer: tf.train.sgd(0.01),

        // loss:
        // calcula qué tan equivocada fue la predicción
        loss: "meanSquaredError"
    });

    document.getElementById("estado").innerText =
        "Estado: entrenando modelo...";

    // entreno el modelo
    await modelo.fit(xs, ys, {

        // cantidad de veces que va a recorrer los datos
        epochs: 100,

        callbacks: {

            // esto se ejecuta al terminar cada época
            onEpochEnd: async (epoch, logs) => {

                // logs.loss trae el error de esa época
                historialLoss.push(logs.loss);

                console.log(
                    `Época ${epoch + 1}: Loss = ${logs.loss}`
                );
            }
        }
    });

    document.getElementById("estado").innerText =
        "Estado: modelo entrenado correctamente";

    // cuando termina el entrenamiento llamo al gráfico
    graficarLoss(historialLoss);
}


// función para dibujar el gráfico
function graficarLoss(lossData) {

    // obtengo el canvas del html
    const ctx = document.getElementById("graficoLoss");

    // si ya existe un gráfico anterior lo elimino
    // para evitar que se superpongan
    if (grafico) {
        grafico.destroy();
    }

    // creo el nuevo gráfico con chart.js
    grafico = new Chart(ctx, {
        type: "line",

        data: {
            // eje x → épocas
            labels: lossData.map((_, i) => i + 1),

            datasets: [{
                label: "Pérdida (Loss)",
                data: lossData,

                borderColor: "#00bcd4",
                backgroundColor: "rgba(0,188,212,0.2)",

                // hace la línea más suave visualmente
                tension: 0.3,

                fill: true
            }]
        },

        options: {
            responsive: true
        }
    });

    // tomo el primer valor de pérdida
    const perdidaInicial = lossData[0].toFixed(4);

    // tomo el último valor de pérdida
    const perdidaFinal =
        lossData[lossData.length - 1].toFixed(4);

    // calculo cuánto bajó el error en porcentaje
    const reduccion = (
        (
            (lossData[0] -
            lossData[lossData.length - 1])
            / lossData[0]
        ) * 100
    ).toFixed(2);

    // muestro esos datos debajo del gráfico
    document.getElementById("resumenLoss").innerHTML =
        `
        <strong>Pérdida inicial:</strong> ${perdidaInicial} |
        <strong>Pérdida final:</strong> ${perdidaFinal}
        <br>
        <strong>Reducción:</strong> ${reduccion}%
        `;
}


// función para hacer predicciones nuevas
function predecirValores() {

    // si todavía no entrené el modelo
    if (!modelo) {
        alert("Primero entrená el modelo");
        return;
    }

    // obtengo lo que escribió el usuario
    const input =
        document.getElementById("inputValores").value;

    // separo los números por coma
    // ejemplo: "10,20,25"
    const valores = input
        .split(",")
        .map(num => Number(num.trim()));

    // convierto esos valores en tensor
    const tensorInput = tf.tensor2d(
        valores.map(v => [v])
    );

    // el modelo hace predicciones
    const predicciones =
        modelo.predict(tensorInput);

    // convierto el resultado para poder mostrarlo
    predicciones.array().then(resultado => {

        let html = "<h3>Resultados:</h3><ul>";

        resultado.forEach((valor, i) => {

            html += `
                <li>
                    Para X = ${valores[i]}
                    → Y ≈ ${valor[0].toFixed(2)}
                </li>
            `;
        });

        html += "</ul>";

        document.getElementById(
            "resultadoPrediccion"
        ).innerHTML = html;
    });
}


// evento para entrenar
document
    .getElementById("btnEntrenar")
    .addEventListener(
        "click",
        entrenarModelo
    );

// evento para predecir
document
    .getElementById("btnPredecir")
    .addEventListener(
        "click",
        predecirValores
    );