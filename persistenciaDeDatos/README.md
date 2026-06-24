# 📚 Aplicación de Gestión de Alumnos

Este proyecto cuenta con **dos versiones**:

1. ✅ Versión **Frontend (sin servidor)**
2. 🚀 Versión **Fullstack (con servidor Node.js)**

---

# 🟣 1. Versión SIN servidor (Frontend puro)

## 📁 Archivos necesarios

* `index.html`
* `styles.css`
* `script.js`

## ▶️ Cómo ejecutarla

1. Asegurarse de que los 3 archivos estén en la misma carpeta
2. Hacer doble click en:

   ```
   index.html
   ```
3. Se abrirá automáticamente en el navegador

## 💾 Cómo funciona

* Los datos se guardan en el navegador usando **localStorage**
* Persisten aunque cierres el navegador
* Cada usuario ve sus propios datos en su computadora

---

# 🌐 2. Versión CON servidor (Node.js + Express)

## 📁 Estructura del proyecto

```
/proyecto
 ├── server.js
 └── /public
      ├── index.html
      ├── styles.css
      └── script.js
```

---

## ⚙️ Requisitos

* Tener instalado **Node.js**

---

## ▶️ Pasos para ejecutar

### 1. Abrir la terminal en la carpeta del proyecto

### 2. Inicializar el proyecto (solo la primera vez)

```bash
npm init -y
```

### 3. Instalar dependencias

```bash
npm install express
```

### 4. Ejecutar el servidor

```bash
node server.js
```

---

## 🌍 Acceder a la aplicación

### 💻 En tu computadora:

```
http://localhost:3000
```

### 🌐 Desde otra computadora en la misma red:

```
http://192.168.0.106:3000
```

⚠️ Ambas computadoras deben estar conectadas al mismo WiFi.

---

## 💾 Cómo funciona

* El navegador genera un `userId` único y lo guarda en localStorage
* El servidor guarda los alumnos en memoria
* Cada usuario ve solo sus propios datos
* Los datos persisten mientras el servidor esté encendido

---

## ⚠️ Importante

* Si el servidor se apaga → se pierden los datos
* No se utiliza una base de datos real (solo memoria RAM)
* La IP `192.168.56.1` NO debe usarse (es una red virtual)
* La IP correcta es la del WiFi: `192.168.0.106`

---

# 🧠 Comparación rápida

| Característica       | Sin servidor | Con servidor       |
| -------------------- | ------------ | ------------------ |
| Persistencia         | Navegador    | Memoria del server |
| Multiusuario         | ❌ No         | ✅ Sí               |
| Requiere instalación | ❌ No         | ✅ Sí (Node.js)     |
| Acceso desde red     | ❌ No         | ✅ Sí               |

---

# 🚀 Conclusión

* La versión sin servidor es más simple y local
* La versión con servidor permite múltiples usuarios y acceso en red

---

## 🔥 Posibles mejoras

* Implementar base de datos (MySQL)
* Agregar login real
* Permitir editar y eliminar alumnos
* Validaciones más avanzadas
