from http.server import BaseHTTPRequestHandler, HTTPServer
import json

# esta clase maneja las peticiones que llegan
class MiServidor(BaseHTTPRequestHandler):

    # este método se ejecuta cuando llega un POST
    def do_POST(self):

        # leo cuánto mide el cuerpo de la request
        content_length = int(self.headers['Content-Length'])

        # leo los datos enviados (en bytes)
        body = self.rfile.read(content_length)

        # convierto esos datos a JSON
        data = json.loads(body)

        # saco las matrices
        m1 = data["m1"]
        m2 = data["m2"]

        # dependiendo de la ruta hago una cosa u otra
        if self.path == "/sumar":
            resultado = []

            for i in range(len(m1)):
                fila = []
                for j in range(len(m1[0])):
                    fila.append(m1[i][j] + m2[i][j])
                resultado.append(fila)

        elif self.path == "/multiplicar":
            resultado = []

            for i in range(len(m1)):
                resultado.append([])
                for j in range(len(m2[0])):
                    suma = 0
                    for k in range(len(m2)):
                        suma += m1[i][k] * m2[k][j]
                    resultado[i].append(suma)

        else:
            resultado = {"error": "Ruta no válida"}

        # respondo al cliente
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()

        # convierto el resultado a JSON y lo envío
        self.wfile.write(json.dumps(resultado).encode())


# levanto el servidor
server = HTTPServer(("localhost", 5000), MiServidor)

print("Servidor corriendo en http://localhost:5000")

server.serve_forever()
