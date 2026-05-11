personas = [] 
continuar = "si"

while continuar == "si":

    nombre = input("Ingrese el nombre: ")
    edad = int(input("Ingrese la edad: "))
    nota = float(input("Ingrese la nota: "))
    datos = [nombre, edad, nota]

    personas.append(datos)
    continuar = input("Desea agregar otra persona? (si/no): ")

print("\nLISTA ORIGINAL")

for persona in personas:

    # Muestro los datos de cada persona
    print("Nombre:", persona[0], "- Edad:", persona[1], "- Nota:", persona[2])

ordenadas = personas.copy()

for i in range(len(ordenadas)):
    
    for j in range(i + 1, len(ordenadas)):
        
        if ordenadas[i][2] < ordenadas[j][2]:

            auxiliar = ordenadas[i]
            ordenadas[i] = ordenadas[j]
            ordenadas[j] = auxiliar

print("\nLISTA ORDENADA POR NOTA")

for persona in ordenadas:

    print("Nombre:", persona[0], "- Edad:", persona[1], "- Nota:", persona[2])

suma = 0

for persona in personas:

    suma = suma + persona[2]

promedio = suma / len(personas)

print("\nPROMEDIO GENERAL:", promedio)