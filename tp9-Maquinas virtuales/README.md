# Sistema Distribuido de Registro de Alumnos
### Arquitectura en 3 Máquinas Virtuales — VirtualBox + Ubuntu Server 24.04

Trabajo práctico de sistemas distribuidos. En este README explico paso a paso cómo armé un sistema de registro de alumnos distribuido en tres máquinas virtuales, con una base de datos MariaDB, un backend en Node.js y un frontend servido por Apache.

---

## Arquitectura general del sistema

```
Tu navegador (PC)
        |
        | http://localhost:8080
        ▼
VM3 — Apache :8080   (Frontend HTML + JS)
        |
        | port forwarding → localhost:3454
        ▼
VM2 — Node.js :3454  (Backend Express API)
        |
        | 192.168.100.10:3306 (red Host-Only)
        ▼
VM1 — MariaDB :3306  (Base de datos)
```

| VM | Rol | IP NAT | IP Host-Only | Puerto SSH |
|---|---|---|---|---|
| VM1-DB | Base de datos MariaDB | 10.0.2.15 | 192.168.100.10 | 2221 |
| VM2-Backend | Servidor Node.js | 10.0.2.16 | 192.168.100.20 | 2222 |
| VM3-Frontend | Servidor Apache | 10.0.2.17 | 192.168.100.30 | 2223 |

---

## Requisitos previos

Antes de empezar, instalé en mi PC:

- **VirtualBox** → https://www.virtualbox.org/wiki/Downloads
- **Ubuntu Server 24.04 ISO** → https://releases.ubuntu.com/24.04/ubuntu-24.04.4-live-server-amd64.iso (descargado una sola vez, ~2.5 GB)
- **PuTTY** (Windows) o usar directamente PowerShell/Terminal para SSH

---

## Parte 1 — Crear las 3 VMs en VirtualBox

Repetí los siguientes pasos exactamente 3 veces, cambiando solo el nombre:

1. Abrí VirtualBox → clic en **Nueva**
2. Nombre: `VM1-DB` / `VM2-Backend` / `VM3-Frontend`
3. Tipo: **Linux** | Versión: **Ubuntu (64-bit)**
4. RAM: **1024 MB** (o 2048 MB si la PC tiene 8 GB o más)
5. Disco: **Crear un disco duro virtual ahora** → tipo **VDI** → **Reservado dinámicamente** → **10 GB**

Al terminar los 3 pasos, las 3 VMs quedaron listadas en el panel izquierdo de VirtualBox.

---

## Parte 2 — Configurar la red (2 adaptadores por VM)

Cada VM usa dos tarjetas de red:
- **Adaptador 1 (NAT):** para internet y para conectarme por SSH desde mi PC
- **Adaptador 2 (Host-Only):** para que las VMs se comuniquen entre sí con IPs fijas

### Paso A — Crear la red Host-Only

En VirtualBox: **Archivo → Administrador de red de anfitrión → Crear**

- IP de la red: `192.168.100.1/24`
- Servidor DHCP: **deshabilitado** (usamos IPs estáticas)

### Paso B — Configurar los adaptadores en cada VM

**Adaptador 1 — NAT** (con reenvío de puertos):

| VM | Nombre | Protocolo | IP Anfitrión | Puerto Anfitrión | Puerto Invitado |
|---|---|---|---|---|---|
| VM1 | SSH | TCP | 127.0.0.1 | 2221 | 22 |
| VM2 | SSH | TCP | 127.0.0.1 | 2222 | 22 |
| VM2 | Backend | TCP | 127.0.0.1 | 3454 | 3454 |
| VM3 | SSH | TCP | 127.0.0.1 | 2223 | 22 |
| VM3 | HTTP | TCP | 127.0.0.1 | 8080 | 8080 |

**Adaptador 2 — Host-Only:**  
En cada VM: Configuración → Red → Adaptador 2 → **Adaptador de solo anfitrión** → seleccionar `vboxnet0`

---

## Parte 3 — Instalar Ubuntu Server en cada VM

Monté la ISO en cada VM desde: **Configuración → Almacenamiento → ícono de CD → Seleccionar archivo ISO**

Durante el instalador configuré:

- **Language:** English
- **Keyboard:** Spanish (o la que corresponda)
- **Type of install:** Ubuntu Server
- **Network:** dejé el default (DHCP temporal)
- **Storage:** Use an entire disk
- **Profile:**
  - Nombre: `alumno`
  - Server name: `vm1-db` / `vm2-backend` / `vm3-frontend`
  - Usuario: `alumno`
  - Contraseña: `alumno123`
- **SSH:** marqué "Install OpenSSH server" con la barra espaciadora

Al terminar la instalación, la VM se reinicia y me conecto por SSH:

```bash
# Desde PowerShell o Terminal de mi PC
ssh -p 2221 alumno@localhost   # VM1
ssh -p 2222 alumno@localhost   # VM2
ssh -p 2223 alumno@localhost   # VM3
```

---

## Parte 4 — Configurar IPs estáticas con Netplan

**MUY IMPORTANTE:** Los archivos YAML usan ESPACIOS, nunca TAB. Un solo TAB rompe la configuración de red.

Ejecuté esto en cada VM:

```bash
# Eliminar el archivo de cloud-init (si existe)
sudo rm /etc/netplan/50-cloud-init.yaml

# Editar el archivo de red
sudo nano /etc/netplan/00-installer-config.yaml
```

**Configuración para VM1:**
```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      addresses:
        - 10.0.2.15/24
      routes:
        - to: default
          via: 10.0.2.2
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
      dhcp4: false
    enp0s8:
      addresses:
        - 192.168.100.10/24
      dhcp4: false
```

**Configuración para VM2:**
```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      addresses:
        - 10.0.2.16/24
      routes:
        - to: default
          via: 10.0.2.2
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
      dhcp4: false
    enp0s8:
      addresses:
        - 192.168.100.20/24
      dhcp4: false
```

**Configuración para VM3:**
```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      addresses:
        - 10.0.2.17/24
      routes:
        - to: default
          via: 10.0.2.2
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
      dhcp4: false
    enp0s8:
      addresses:
        - 192.168.100.30/24
      dhcp4: false
```

Guardé con `Ctrl+O → Enter → Ctrl+X` y apliqué:

```bash
sudo chmod 600 /etc/netplan/00-installer-config.yaml
sudo netplan apply
```

Verifiqué que las interfaces estuvieran activas:

```bash
ip a
# enp0s3 debe tener la IP NAT (10.0.2.1x)
# enp0s8 debe tener la IP Host-Only (192.168.100.xx)
```

Si `enp0s8` aparece como DOWN:
```bash
# Reemplazar XX según la VM: 10, 20 o 30
sudo ip link set enp0s8 up
sudo ip addr add 192.168.100.XX/24 dev enp0s8
```

Si no hay internet:
```bash
sudo ip route add default via 10.0.2.2
echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf
```

---

## Parte 5 — Desactivar cloud-init

Para que las VMs arranquen más rápido, deshabilité cloud-init en las 3 VMs:

```bash
sudo touch /etc/cloud/cloud-init.disabled
sudo systemctl stop cloud-init
sudo systemctl disable cloud-init
sudo systemctl mask cloud-init
sudo systemctl disable cloud-config
sudo systemctl disable cloud-final
sudo systemctl disable cloud-init-local
sudo systemctl disable systemd-networkd-wait-online.service
sudo systemctl mask systemd-networkd-wait-online.service

# Verificar
systemctl status cloud-init
# Debe mostrar: disabled / masked

# Reiniciar la VM
sudo reboot
```

---

## Parte 6 — VM1: Base de datos MariaDB

Me conecté por SSH: `ssh -p 2221 alumno@localhost`

### Instalar MariaDB

```bash
sudo apt update
sudo apt install -y mariadb-server
```

### Permitir conexiones remotas

Por defecto MariaDB solo acepta conexiones locales. Lo cambié así:

```bash
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Busqué la línea `bind-address = 127.0.0.1` con `Ctrl+W` y la cambié por:

```
bind-address = 0.0.0.0
```

Guardé y reinicié:

```bash
sudo systemctl restart mariadb

# Verificar que escucha en todas las interfaces
sudo ss -tlnp | grep 3306
# Debe mostrar: 0.0.0.0:3306
```

### Crear la base de datos, la tabla y el usuario

```bash
sudo mysql -u root
```

Dentro de la consola MariaDB ejecuté:

```sql
CREATE DATABASE instituto;
USE instituto;

CREATE TABLE alumnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  apellidos VARCHAR(200) NOT NULL,
  nombres VARCHAR(200) NOT NULL,
  dni VARCHAR(100) UNIQUE NOT NULL
);

CREATE USER 'usuario_consulta'@'%' IDENTIFIED BY '123';
GRANT ALL PRIVILEGES ON instituto.* TO 'usuario_consulta'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Verifiqué que el usuario funciona:

```bash
mysql -u usuario_consulta -p123 -h 192.168.100.10 instituto
# Debe mostrar: MariaDB [instituto]>
```

---

## Parte 7 — VM2: Backend Node.js

Me conecté por SSH: `ssh -p 2222 alumno@localhost`

### Instalar Node.js y npm

```bash
sudo apt update
sudo apt install -y nodejs npm

node -v
npm -v
```

### Crear el proyecto del backend

```bash
mkdir ~/backend
cd ~/backend
npm init -y
npm install express mysql2 cors
```

Instalé tres librerías:
- `express` → servidor HTTP
- `mysql2` → conexión a MariaDB
- `cors` → permite que el frontend del navegador consuma la API

### Crear el archivo index.js

```bash
nano ~/backend/index.js
```

Pegué el siguiente código:

```javascript
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: '192.168.100.10',
  user: 'usuario_consulta',
  password: '123',
  database: 'instituto'
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la BD:', err);
    return;
  }
  console.log('Conectado a la base de datos en VM1');
});

// POST /grabaAlumnos
app.post('/grabaAlumnos', (req, res) => {
  const { apellidos, nombres, dni } = req.body;
  if (!apellidos || !nombres || !dni) {
    return res.json({ resultado: 0, mensaje: 'Faltan datos' });
  }
  const sql = 'INSERT INTO alumnos (apellidos, nombres, dni) VALUES (?, ?, ?)';
  db.query(sql, [apellidos, nombres, dni], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.json({ resultado: 0, mensaje: 'DNI ya registrado' });
      }
      return res.json({ resultado: 0, mensaje: 'Error al guardar' });
    }
    res.json({ resultado: 1, mensaje: 'Alumno guardado correctamente' });
  });
});

// GET /consultarAlumnos
app.get('/consultarAlumnos', (req, res) => {
  const sql = 'SELECT apellidos, nombres, dni FROM alumnos ORDER BY apellidos, nombres';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al consultar' });
    }
    res.json(results);
  });
});

app.listen(3454, () => {
  console.log('Backend corriendo en puerto 3454');
});
```

### Iniciar el backend

```bash
node ~/backend/index.js
```

Si todo salió bien, la consola muestra:
```
Backend corriendo en puerto 3454
Conectado a la base de datos en VM1
```

> Para dejar el backend corriendo en segundo plano sin que se cierre al salir de SSH: usar `nohup node ~/backend/index.js &`

---

## Parte 8 — VM3: Frontend Apache

Me conecté por SSH: `ssh -p 2223 alumno@localhost`

### Instalar Apache

```bash
sudo apt update
sudo apt install -y apache2
```

### Cambiar Apache al puerto 8080

**Archivo 1 — ports.conf:**
```bash
sudo nano /etc/apache2/ports.conf
# Cambiar: Listen 80  →  Listen 8080
```

**Archivo 2 — VirtualHost:**
```bash
sudo nano /etc/apache2/sites-available/000-default.conf
# Cambiar: <VirtualHost *:80>  →  <VirtualHost *:8080>
```

```bash
sudo systemctl restart apache2
```

### Crear el frontend HTML

```bash
sudo mkdir -p /var/www/html/Sistema
sudo nano /var/www/html/Sistema/index.html
```

Pegué el siguiente código HTML:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Sistema de Alumnos</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    input { padding: 8px; margin: 5px; width: 200px; }
    button { padding: 8px 16px; margin: 5px; background-color: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 4px; }
    #mensaje { margin: 10px 0; padding: 10px; border-radius: 4px; }
    .exito { background-color: #dff0d8; color: #3c763d; }
    .error { background-color: #f2dede; color: #a94442; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Sistema de Registro de Alumnos</h1>

  <h2>Cargar Alumno</h2>
  <input type="text" id="apellidos" placeholder="Apellidos">
  <input type="text" id="nombres" placeholder="Nombres">
  <input type="text" id="dni" placeholder="DNI">
  <br>
  <button onclick="grabarAlumno()">Guardar</button>
  <div id="mensaje"></div>

  <h2>Lista de Alumnos</h2>
  <button onclick="consultarAlumnos()">Consultar</button>
  <table id="tabla" style="display:none">
    <thead>
      <tr><th>Apellidos</th><th>Nombres</th><th>DNI</th></tr>
    </thead>
    <tbody id="cuerpo"></tbody>
  </table>

  <script>
    const BACKEND = 'http://localhost:3454';

    function grabarAlumno() {
      const apellidos = document.getElementById('apellidos').value.trim();
      const nombres = document.getElementById('nombres').value.trim();
      const dni = document.getElementById('dni').value.trim();
      const msg = document.getElementById('mensaje');

      if (!apellidos || !nombres || !dni) {
        msg.className = 'error';
        msg.textContent = 'Completa todos los campos';
        return;
      }

      fetch(`${BACKEND}/grabaAlumnos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apellidos, nombres, dni })
      })
      .then(r => r.json())
      .then(data => {
        if (data.resultado === 1) {
          msg.className = 'exito';
          msg.textContent = 'OK: ' + data.mensaje;
          document.getElementById('apellidos').value = '';
          document.getElementById('nombres').value = '';
          document.getElementById('dni').value = '';
        } else {
          msg.className = 'error';
          msg.textContent = 'Error: ' + data.mensaje;
        }
      })
      .catch(() => {
        msg.className = 'error';
        msg.textContent = 'Error conectando al servidor';
      });
    }

    function consultarAlumnos() {
      fetch(`${BACKEND}/consultarAlumnos`)
      .then(r => r.json())
      .then(data => {
        const cuerpo = document.getElementById('cuerpo');
        cuerpo.innerHTML = '';
        data.forEach(a => {
          cuerpo.innerHTML += `<tr><td>${a.apellidos}</td><td>${a.nombres}</td><td>${a.dni}</td></tr>`;
        });
        document.getElementById('tabla').style.display = 'table';
      })
      .catch(() => alert('Error consultando alumnos'));
    }
  </script>
</body>
</html>
```

```bash
sudo systemctl restart apache2

# Verificar desde dentro de VM3
curl http://localhost:8080/Sistema/index.html
```

---

## Parte 9 — Prueba final

### Checklist antes de abrir el navegador

```bash
# VM1 — MariaDB corriendo
sudo systemctl status mariadb
# → debe decir: active (running)

# VM2 — Backend Node.js corriendo
node ~/backend/index.js
# → debe mostrar las 2 líneas de conexión OK

# VM3 — Apache corriendo
sudo systemctl status apache2
# → debe decir: active (running)

# Todas las VMs — interfaz Host-Only activa
ip a | grep 192.168.100

# Desde VM2 — verificar acceso a MariaDB de VM1
nc -zv 192.168.100.10 3306
# → Connection to 192.168.100.10 3306 port [tcp/mysql] succeeded!

# Desde VM3 — verificar que Apache sirve el HTML
curl http://localhost:8080/Sistema/index.html
```

### Prueba desde el navegador de la PC

1. Con el backend corriendo en VM2, abrí el navegador en la PC física
2. Entrá a: `http://localhost:8080/Sistema/index.html`
3. Completá el formulario: Apellidos, Nombres, DNI → clic en **Guardar**
4. Debe aparecer en verde: `OK: Alumno guardado correctamente`
5. Probé cargar el mismo DNI de nuevo → aparece en rojo: `Error: DNI ya registrado`
6. Clic en **Consultar** → aparece la tabla con todos los alumnos ordenados por apellido

---

## Estructura final del proyecto

```
VM1 (MariaDB — 192.168.100.10)
└── Base de datos: instituto
    └── Tabla: alumnos (id, apellidos, nombres, dni UNIQUE)

VM2 (Node.js — 192.168.100.20)
└── ~/backend/
    ├── index.js         ← servidor Express (API REST)
    ├── package.json
    └── node_modules/

VM3 (Apache — 192.168.100.30)
└── /var/www/html/
    └── Sistema/
        └── index.html   ← frontend HTML + JS
```

---

## Errores comunes y soluciones

| Error | Causa | Solución |
|---|---|---|
| `Failed to fetch` en apt | Sin DNS o sin gateway | `sudo ip route add default via 10.0.2.2` + `echo 'nameserver 8.8.8.8' \| sudo tee /etc/resolv.conf` |
| `Network is unreachable` | Sin puerta de enlace | `sudo ip route add default via 10.0.2.2` |
| SSH se cuelga tras cambiar netplan | La IP cambió | Actualizar "IP Invitado" en las reglas de reenvío de VirtualBox |
| `EHOSTUNREACH` en Node.js | IP incorrecta en index.js o enp0s8 DOWN | Verificar `host: '192.168.100.10'` en index.js + `sudo ip link set enp0s8 up` |
| `ETIMEDOUT` en Node.js | enp0s8 de VM1 DOWN o MariaDB rechaza conexiones | `sudo ip link set enp0s8 up && sudo ip addr add 192.168.100.10/24 dev enp0s8` + verificar `bind-address = 0.0.0.0` |
| `Connection refused` en puerto 3306 | enp0s8 de VM1 caída | `sudo ip link set enp0s8 up` + `sudo ip addr add 192.168.100.10/24 dev enp0s8` |
| `Access Denied` en MariaDB | Usuario sin permisos | Recrear el usuario desde `sudo mysql -u root` |
| Página no carga en navegador | Falta regla de reenvío para 8080 | Agregar regla en VirtualBox VM3: `127.0.0.1:8080 → 10.0.2.17:8080` |
| Error 403 Forbidden en Apache | Permisos incorrectos | `sudo chmod -R 755 /var/www/html/Sistema` + `sudo chown -R www-data:www-data /var/www/html/Sistema` |
| `netplan apply` da error de permisos | Archivo YAML con permisos abiertos | `sudo chmod 600 /etc/netplan/00-installer-config.yaml` |
| enp0s8 vuelve a DOWN al reiniciar | IPs manuales no persisten | Verificar que el netplan esté bien escrito y aplicado |
| `Error conectando al servidor` en frontend | Backend no corre en VM2 | Conectarse a VM2 y ejecutar `node ~/backend/index.js` |

---

## Tecnologías utilizadas

- **VirtualBox** — Virtualización de máquinas
- **Ubuntu Server 24.04** — Sistema operativo de cada VM
- **MariaDB** — Base de datos relacional (VM1)
- **Node.js + Express** — API REST del backend (VM2)
- **mysql2 + cors** — Librerías npm del backend
- **Apache2** — Servidor web del frontend (VM3)
- **Netplan** — Configuración de red estática en Ubuntu
- **SSH / PuTTY** — Acceso remoto a las VMs
