# 📌 Operaciones con Matrices

Este proyecto permite realizar suma y multiplicación de matrices desde un sitio web.

Incluye dos versiones:
- Versión cliente (todo en JavaScript)
- Versión cliente-servidor (Node.js y Python)

---

## 📁 Estructura


matrices/
├── cliente/
│ ├── index.html
│ ├── script.js
├── servidor-node/
│ └── server.js
├── servidor-python/
│ └── server.py


---

## 🚀 Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd matrices
▶️ Ejecutar versión cliente

Abrir el archivo:

cliente/index.html

en el navegador.

▶️ Ejecutar servidor Node.js
Instalar dependencias:
npm install express cors
Ejecutar:
node server.js

Servidor en: http://localhost:3000

▶️ Ejecutar servidor Python
Instalar Flask:
pip install flask
Ejecutar:
python server.py

Servidor en: http://localhost:5000

🧠 Funcionamiento
El usuario define tamaño de matrices
Ingresa los valores
Puede:
Calcular localmente (JavaScript)
O enviar al servidor para calcular
⚠️ Consideraciones
Validación básica de inputs
No usa base de datos
Funciona completamente en navegador + servidor local
