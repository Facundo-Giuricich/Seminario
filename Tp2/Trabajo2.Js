let personas = [];
let continuar = "si";

while (continuar == "si") {

    let nombre = prompt("Ingrese el nombre:");
    let edad = parseInt(prompt("Ingrese la edad:"));
    let nota = parseFloat(prompt("Ingrese la nota:"));
    let datos = [nombre, edad, nota];

    personas.push(datos);

    continuar = prompt("Desea agregar otra persona? (si/no)");
}

console.log("LISTA ORIGINAL");

for (let i = 0; i < personas.length; i++) {

    console.log(
        "Nombre: " + personas[i][0] +
        " - Edad: " + personas[i][1] +
        " - Nota: " + personas[i][2]
    );
}

let ordenadas = personas.slice();

for (let i = 0; i < ordenadas.length; i++) {

    for (let j = i + 1; j < ordenadas.length; j++) {

        if (ordenadas[i][2] < ordenadas[j][2]) {

            let auxiliar = ordenadas[i];
            ordenadas[i] = ordenadas[j];
            ordenadas[j] = auxiliar;
        }
    }
}

console.log("LISTA ORDENADA POR NOTA");

for (let i = 0; i < ordenadas.length; i++) {

    console.log(
        "Nombre: " + ordenadas[i][0] +
        " - Edad: " + ordenadas[i][1] +
        " - Nota: " + ordenadas[i][2]
    );
}

let suma = 0;

for (let i = 0; i < personas.length; i++) {

    suma = suma + personas[i][2];
}

let promedio = suma / personas.length;

console.log("PROMEDIO GENERAL: " + promedio);