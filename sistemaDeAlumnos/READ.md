# Sistema Distribuido de Registro de Alumnos
### Arquitectura en 3 Máquinas Virtuales — VirtualBox + Ubuntu Server 24.04

> **Leé esta guía completa de principio a fin antes de empezar. Seguí los pasos en orden y no te saltees ninguno.**

---

## Arquitectura del sistema

```
VM 1 — Base de Datos MariaDB
  NAT: 10.0.2.15 | Host-Only: 192.168.100.10 | SSH → Puerto 2221

VM 2 — Backend Node.js :3454
  NAT: 10.0.2.16 | Host-Only: 192.168.100.20 | SSH → Puerto 2222

VM 3 — Frontend Apache :8080
  NAT: 10.0.2.17 | Host-Only: 192.168.100.30 | SSH → Puerto 2223
```

**Flujo de comunicación:**
```
Tu navegador (PC) → http://localhost:8080
        ↓
VM3 — Apache :8080  →  reenvío de puertos  →  localhost:3454
        ↓
VM2 — Node.js :3454  →  192.168.100.10:3306 (Host-Only)
        ↓
VM1 — MariaDB :3306  →  responde con los datos de la BD instituto
```

---

## Índice

0. [Requisitos previos](#parte-0--requisitos-previos)
1. [Crear las 3 VMs en VirtualBox](#parte-1--crear-las-3-vms-en-virtualbox)
2. [Configurar la red — 2 adaptadores por VM](#parte-2--configurar-la-red--2-adaptadores-por-vm)
3. [Instalar Ubuntu Server en cada VM](#parte-3--instalar-ubuntu-server-en-cada-vm)
4. [Configurar IPs estáticas con Netplan](#parte-4--configurar-ips-estáticas-con-netplan)
5. [Desactivar cloud-init](#parte-5--desactivar-cloud-init)
6. [VM1 — Base de datos MariaDB](#parte-6--vm1--base-de-datos-mariadb)
7. [VM2 — Backend Node.js](#parte-7--vm2--backend-nodejs)
8. [VM3 — Frontend Apache](#parte-8--vm3--frontend-apache)
9. [Prueba final y verificación del sistema](#parte-9--prueba-final-y-verificación-del-sistema)
10. [Errores comunes y soluciones](#parte-10--errores-comunes-y-soluciones)

---

## PARTE 0 — Requisitos previos

Software que necesitás en tu PC antes de empezar.

### VirtualBox
**Descarga:** https://www.virtualbox.org/wiki/Downloads

El programa que crea y corre las máquinas virtuales Linux. Descargá el instalador para tu sistema operativo (Windows/Mac/Linux). Instalalo como cualquier programa: siguiente → siguiente → instalar. Si durante la instalación te pide instalar drivers de red virtuales, aceptá.

### Ubuntu Server 24.04 (archivo ISO)
**Descarga:** https://releases.ubuntu.com/24.04/ubuntu-24.04.4-live-server-amd64.iso

La imagen del sistema operativo que vas a instalar en las 3 VMs. Es un archivo `.iso` de aproximadamente 2.5 GB. Descargalo una sola vez y guardalo en una carpeta fácil de encontrar (por ejemplo `C:\ISOs\` en Windows). **No necesitás descargarlo 3 veces.**

### PuTTY (Windows) o usar PowerShell/Terminal
**Descarga:** https://www.putty.org

Cliente SSH para conectarte a las VMs desde tu PC sin necesidad de usar la pantalla de VirtualBox. En Windows descargá PuTTY. En Mac o Linux podés usar directamente la Terminal con el comando `ssh`. También podés usar PowerShell en Windows con:

```powershell
ssh -p 2221 alumno@localhost
```

---

## PARTE 1 — Crear las 3 VMs en VirtualBox

> **Vas a repetir estos mismos pasos 3 veces.** Solo cambia el nombre: `VM1-DB`, `VM2-Backend`, `VM3-Frontend`. El resto de la configuración es idéntica.

### Pasos para crear cada máquina virtual

1. Abrí VirtualBox. Hacé clic en el botón azul **Nueva** en la barra de herramientas superior.
2. En el campo **Nombre** escribí: `VM1-DB` (primera vez), `VM2-Backend` (segunda), `VM3-Frontend` (tercera).
3. En **Tipo** seleccioná `Linux`. En **Versión** seleccioná `Ubuntu (64-bit)`. Clic en **Siguiente**.
4. En **Memoria base (RAM)** escribí `1024 MB` (1 GB). Si tu PC tiene 8 GB o más podés poner `2048 MB`. Clic en **Siguiente**.
5. En la pantalla de disco duro seleccioná **"Crear un disco duro virtual ahora"**. Clic en **Crear**.
6. Tipo de archivo de disco duro: dejá **VDI** seleccionado. Clic en **Siguiente**.
7. Almacenamiento: seleccioná **Reservado dinámicamente**. Clic en **Siguiente**.
8. Tamaño: dejalo en **10 GB**. Clic en **Crear**. La VM aparece en la lista izquierda de VirtualBox.

✔ Cuando termines los 8 pasos, repetílos para `VM2-Backend` y `VM3-Frontend`. Al finalizar tendrás 3 VMs en la lista de VirtualBox.

---

## PARTE 2 — Configurar la red — 2 adaptadores por VM

> Este sistema usa **2 tarjetas de red por VM**:
> - **Adaptador 1 (NAT):** para internet y SSH desde tu PC.
> - **Adaptador 2 (Host-Only):** para que las VMs se comuniquen entre sí con IPs fijas del rango `192.168.100.x`.

### Paso A — Crear la red Host-Only en VirtualBox

1. En el menú de VirtualBox andá a **Archivo → Administrador de red de anfitrión** (en Mac: VirtualBox → Administrador de red...).
2. Hacé clic en el botón **Crear**. Aparecerá una red llamada `vboxnet0` (o similar).
3. Verificá que tenga la IP `192.168.100.1/24`. Si no, editala y ponele esa IP.
4. Asegurate que el **servidor DHCP esté deshabilitado** (vamos a usar IPs estáticas). Clic en **Aplicar**.

### Paso B — Configurar los 2 adaptadores en cada VM

Hacé esto para las 3 VMs. Seleccioná la VM → **Configuración → Red**.

#### Adaptador 1 — NAT (internet y SSH)

1. Seleccioná la VM → clic en **Configuración** (engranaje) → pestaña **Red**.
2. En **Adaptador 1**: tildá "Habilitar adaptador de red".
3. En "Conectado a" seleccioná **NAT**.
4. Expandí **"Avanzado"** → clic en **"Reenvío de puertos"** para agregar las reglas SSH (ver tabla abajo).

#### Reglas de reenvío de puertos por VM

**VM1 — Base de datos:**

| Nombre | Protocolo | IP Anfitrión | Puerto Anfitrión | IP Invitado | Puerto Invitado |
|--------|-----------|-------------|-----------------|-------------|----------------|
| SSH    | TCP       | 127.0.0.1   | 2221            | 10.0.2.15   | 22             |

**VM2 — Backend:**

| Nombre  | Protocolo | IP Anfitrión | Puerto Anfitrión | IP Invitado | Puerto Invitado |
|---------|-----------|-------------|-----------------|-------------|----------------|
| SSH     | TCP       | 127.0.0.1   | 2222            | 10.0.2.16   | 22             |
| Backend | TCP       | 127.0.0.1   | 3454            | 10.0.2.16   | 3454           |

**VM3 — Frontend:**

| Nombre | Protocolo | IP Anfitrión | Puerto Anfitrión | IP Invitado | Puerto Invitado |
|--------|-----------|-------------|-----------------|-------------|----------------|
| SSH    | TCP       | 127.0.0.1   | 2223            | 10.0.2.17   | 22             |
| HTTP   | TCP       | 127.0.0.1   | 8080            | 10.0.2.17   | 8080           |

#### Adaptador 2 — Host-Only (comunicación entre VMs)

1. Seguí en **Configuración → Red** de la misma VM.
2. Hacé clic en la pestaña **Adaptador 2**.
3. Tildá "Habilitar adaptador de red".
4. En "Conectado a" seleccioná **Adaptador de solo anfitrión**.
5. En **Nombre** seleccioná la red que creaste antes (`vboxnet0` o similar).
6. Clic en **OK**. Repetí para las otras 2 VMs.

> **Recordá:** El Adaptador 1 (NAT) tiene sus propias reglas de reenvío de puertos por VM. El Adaptador 2 (Host-Only) es el mismo para las 3 VMs: `vboxnet0`.

---

## PARTE 3 — Instalar Ubuntu Server en cada VM

> Repetir en las 3 VMs — tarda 5 a 15 min cada una.

### Montar la ISO e iniciar

1. Seleccioná la VM en VirtualBox → **Configuración → Almacenamiento**.
2. Hacé clic en el ícono de CD que dice "Vacío" en el árbol.
3. A la derecha, clic en el ícono de disco junto a "Unidad óptica" → "Seleccionar archivo de disco...".
4. Navegá hasta el archivo `ubuntu-24.04.4-live-server-amd64.iso` y seleccionalo. Clic en **OK**.
5. Hacé clic en el botón verde **Iniciar**. Se abre la ventana de la VM y arranca el instalador.

> Usá las **flechas del teclado** para navegar entre opciones. **ESPACIO** para marcar/desmarcar. **TAB** para mover el foco entre botones. **ENTER** para confirmar.

### Pasos del instalador de Ubuntu

| Pantalla | Acción |
|----------|--------|
| Language | Seleccioná `English` → Enter |
| Keyboard | Elegí tu distribución (`Spanish` si corresponde). Navegá a "Done" → Enter |
| Type of install | Seleccioná `Ubuntu Server` (opción por defecto). "Done" → Enter |
| Network | Dejalo como está, VirtualBox asignará IP automática temporalmente. "Done" → Enter |
| Proxy | Dejalo vacío. "Done" → Enter |
| Mirror | Dejalo por defecto. "Done" → Enter. (Puede tardar al verificar la conexión.) |
| Storage | Seleccioná "Use an entire disk". "Done" → Enter → "Continue" en la advertencia |
| Profile — Nombre | En "Your name" escribí: `alumno` |
| Profile — Servidor | En "Server's name" escribí: `vm1-db` / `vm2-backend` / `vm3-frontend` según corresponda |
| Profile — Usuario | En "Username" escribí: `alumno`. En "Password" escribí: `alumno123`. Confirmá la contraseña |
| SSH Setup | Marcá "Install OpenSSH server" con la barra **ESPACIO** (debe aparecer `[X]`). "Done" → Enter |
| Snaps | No marques nada. "Done" → Enter |
| Instalación | Esperá que termine (barra de progreso). Cuando aparezca "Reboot Now" → Enter |
| Post-reboot | Cuando pida quitar el medio, presioná Enter. La VM se reinicia. Iniciá sesión con `alumno` / `alumno123` |

### Conectarte por SSH después de la instalación

- **PuTTY:** Host: `127.0.0.1` → Port: `2221` (VM1), `2222` (VM2), `2223` (VM3) → Open → usuario: `alumno` / contraseña: `alumno123`
- **PowerShell:**
  ```powershell
  ssh -p 2221 alumno@localhost
  ```

---

## PARTE 4 — Configurar IPs estáticas con Netplan

> **MUY IMPORTANTE:** La indentación en los archivos YAML es con **ESPACIOS**, **NUNCA con TAB**. Si ponés un TAB el archivo no funcionará y la red no se configurará.

### Paso 1 — Eliminar el archivo de cloud-init

En cada VM ejecutá:

```bash
sudo rm /etc/netplan/50-cloud-init.yaml
```

✔ Si el archivo no existe, no pasa nada. El mensaje `No such file or directory` es normal.

### Paso 2 — Editar el archivo de configuración de red

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Borrá todo el contenido existente y pegá la configuración correspondiente a cada VM:

#### VM1 — Base de datos

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

#### VM2 — Backend

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

#### VM3 — Frontend

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

Guardá con `Ctrl+O` → Enter → `Ctrl+X`. Luego aplicá la configuración:

```bash
sudo chmod 600 /etc/netplan/00-installer-config.yaml
sudo netplan apply
```

### Verificar que las interfaces están activas

```bash
ip a
```

Deberías ver `enp0s3` con la IP NAT (`10.0.2.1x`) y `enp0s8` con la IP Host-Only (`192.168.100.xx`). Si `enp0s8` aparece como DOWN:

```bash
# Reemplazá XX según la VM: 10 para VM1, 20 para VM2, 30 para VM3
sudo ip link set enp0s8 up
sudo ip addr add 192.168.100.XX/24 dev enp0s8
```

> Si no hay internet (falla `apt update`), ejecutá:
> ```bash
> sudo ip route add default via 10.0.2.2
> echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf
> ```

---

## PARTE 5 — Desactivar cloud-init

> Para que las VMs arranquen más rápido — en las 3 VMs.

Cloud-init es un servicio que Ubuntu usa para configurarse en la nube. En una VM local no lo necesitamos y hace que el arranque tarde mucho más. Ejecutá estos comandos en las 3 VMs:

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
```

### Verificar que quedó desactivado

```bash
systemctl status cloud-init
# Debe mostrar: disabled / masked
```

> Después de deshabilitar cloud-init, reiniciá la VM con `sudo reboot`. Al volver a conectarte debería arrancar en 10-20 segundos.

---

## PARTE 6 — VM1 — Base de datos MariaDB

> Conectate por SSH al puerto 2221
> ```bash
> ssh -p 2221 alumno@localhost
> ```

### Instalar MariaDB

```bash
sudo apt update
sudo apt install -y mariadb-server
```

> Si `apt update` falla con "Failed to fetch", ejecutá primero:
> ```bash
> sudo ip route add default via 10.0.2.2
> echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf
> ```

### Permitir conexiones desde VM2 (cambiar bind-address)

Por defecto MariaDB solo acepta conexiones locales. Hay que abrirlo:

```bash
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Dentro del archivo, usá `Ctrl+W` para buscar la palabra `bind-address`. Encontrarás una línea que dice `bind-address = 127.0.0.1`. Cambiala por:

```
bind-address = 0.0.0.0
```

Guardá (`Ctrl+O` → Enter → `Ctrl+X`) y reiniciá MariaDB:

```bash
sudo systemctl restart mariadb
```

Verificar que escucha en todas las interfaces:

```bash
sudo ss -tlnp | grep 3306
# Debe mostrar: 0.0.0.0:3306
```

### Crear la base de datos, la tabla y el usuario remoto

Entrá a la consola de MariaDB:

```bash
sudo mysql -u root
```

Una vez dentro (verás el prompt `MariaDB [(none)]>`), ejecutá todo esto:

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

> El `@'%'` significa que el usuario puede conectarse desde cualquier IP. Las comillas simples alrededor de `usuario_consulta` son obligatorias porque el guion medio requiere ese tratamiento en SQL.

### Verificar que el usuario funciona desde VM1

```bash
mysql -u usuario_consulta -p123 -h 192.168.100.10 instituto
# Debe mostrar: MariaDB [instituto]>
# Para salir: EXIT;
```

> Si da "Access Denied", el usuario no fue creado correctamente. Volvé a entrar con `sudo mysql -u root` y ejecutá:
> ```sql
> DROP USER 'usuario_consulta'@'%';
> ```
> Después volvé a crearlo con los comandos de arriba.

---

## PARTE 7 — VM2 — Backend Node.js

> Conectate por SSH al puerto 2222
> ```bash
> ssh -p 2222 alumno@localhost
> ```

### Instalar Node.js y npm

```bash
sudo apt update
sudo apt install -y nodejs npm
node -v
npm -v
```

Los últimos dos comandos deben mostrar versiones (ej: `v12.x.x` y `8.x.x`).

### Crear el proyecto del backend

```bash
mkdir ~/backend
cd ~/backend
npm init -y
npm install express mysql2 cors
```

Esto instala 3 librerías: `express` (servidor HTTP), `mysql2` (conexión a MariaDB) y `cors` (permite que el frontend del navegador consuma la API).

### Crear el archivo index.js

```bash
nano ~/backend/index.js
```

Pegá todo el siguiente código:

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

Guardá con `Ctrl+O` → Enter → `Ctrl+X`.

### Iniciar el backend y verificar

```bash
node ~/backend/index.js
```

Deberías ver exactamente estas dos líneas:

```
Backend corriendo en puerto 3454
Conectado a la base de datos en VM1
```

**Errores posibles:**
- `EHOSTUNREACH`: la IP en `index.js` está mal. Verificá que `host` sea `'192.168.100.10'` y que `enp0s8` de VM1 esté UP.
- `ETIMEDOUT`: MariaDB no está accesible. Verificá que VM1 esté encendida, que `bind-address` sea `0.0.0.0` y que `enp0s8` de VM1 esté activa.

> Si `enp0s8` de VM2 se cae al reiniciar, ejecutá:
> ```bash
> sudo ip link set enp0s8 up && sudo ip addr add 192.168.100.20/24 dev enp0s8
> ```
>
> Para dejar el backend corriendo en segundo plano usá `nohup` o dejá la sesión SSH abierta mientras probás. Para detenerlo presioná `Ctrl+C`.

---

## PARTE 8 — VM3 — Frontend Apache

> Conectate por SSH al puerto 2223
> ```bash
> ssh -p 2223 alumno@localhost
> ```

### Instalar Apache

```bash
sudo apt update
sudo apt install -y apache2
```

### Cambiar Apache al puerto 8080

**Archivo 1 — ports.conf:**

```bash
sudo nano /etc/apache2/ports.conf
```

Buscá la línea `Listen 80` y cambiala por `Listen 8080`. Guardá con `Ctrl+O` → Enter → `Ctrl+X`.

**Archivo 2 — VirtualHost:**

```bash
sudo nano /etc/apache2/sites-available/000-default.conf
```

Buscá la línea `<VirtualHost *:80>` y cambiala por `<VirtualHost *:8080>`. Guardá con `Ctrl+O` → Enter → `Ctrl+X`.

Reiniciá Apache para aplicar los cambios:

```bash
sudo systemctl restart apache2
```

### Crear la carpeta y el archivo HTML

```bash
sudo mkdir -p /var/www/html/Sistema
sudo nano /var/www/html/Sistema/index.html
```

Pegá todo el siguiente código HTML:

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

Guardá con `Ctrl+O` → Enter → `Ctrl+X`. Reiniciá Apache:

```bash
sudo systemctl restart apache2
```

### Verificar desde dentro de VM3

```bash
curl http://localhost:8080/Sistema/index.html
```

> **Nota sobre el BACKEND en el HTML:** el código dice `const BACKEND = 'http://localhost:3454'`. Esto funciona porque el reenvío de puertos de VirtualBox redirige `localhost:3454` de tu PC hacia VM2. Si el frontend no puede llegar al backend, verificá que la regla de reenvío del puerto 3454 esté configurada en VM2.

---

## PARTE 9 — Prueba final y verificación del sistema

### Checklist — verificar antes de abrir el navegador

| Estado | Verificación | Comando |
|--------|-------------|---------|
| ☐ VM1 encendida | MariaDB activo | `sudo systemctl status mariadb` → debe decir `active (running)` |
| ☐ VM2 encendida | Backend corriendo | `node ~/backend/index.js` → debe mostrar las 2 líneas de conexión OK |
| ☐ VM3 encendida | Apache activo | `sudo systemctl status apache2` → debe decir `active (running)` |
| ☐ enp0s8 activa en todas | IP Host-Only visible | `ip a \| grep 192.168.100` → debe mostrar la IP de cada VM |
| ☐ Backend accesible desde VM2 | Puerto 3306 alcanzable | `nc -zv 192.168.100.10 3306` → debe decir `succeeded` |
| ☐ Apache sirve el HTML | Curl desde VM3 | `curl http://localhost:8080/Sistema/index.html` |

### Verificar la cadena completa desde VM2

```bash
# Desde VM2 — verificar que MariaDB de VM1 es accesible
nc -zv 192.168.100.10 3306
# Debe mostrar: Connection to 192.168.100.10 3306 port [tcp/mysql] succeeded!
```

### Probar el sistema desde el navegador de tu PC

1. Asegurate que VM2 tenga el backend corriendo: `node ~/backend/index.js` (dejar esa terminal SSH abierta).
2. Abrí tu navegador (Chrome, Firefox, Edge) en tu PC física.
3. Escribí en la barra de direcciones: `http://localhost:8080/Sistema/index.html` → Enter.
4. Deberías ver el formulario con los 3 campos y los 2 botones.
5. Completá: Apellidos: `Garcia`, Nombres: `Juan`, DNI: `12345678`. Clic en **Guardar**.
6. Debe aparecer en verde: **"OK: Alumno guardado correctamente"**.
7. Cargá 2 alumnos más con diferentes DNI.
8. Clic en **Consultar**. Debe aparecer la tabla con los alumnos ordenados por apellido.
9. Intentá cargar el mismo DNI de nuevo. Debe aparecer en rojo: **"Error: DNI ya registrado"**.

✔ Si todo funciona correctamente hasta acá, el sistema está completo.

---

## PARTE 10 — Errores comunes y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `Failed to fetch` (apt install) | Sin DNS o sin gateway en la VM | `sudo ip route add default via 10.0.2.2` <br> `echo 'nameserver 8.8.8.8' \| sudo tee /etc/resolv.conf` |
| `Network is unreachable` | Sin puerta de enlace configurada | `sudo ip route add default via 10.0.2.2` |
| SSH se cuelga tras cambiar netplan | La IP cambió y el reenvío de puertos ya no aplica | Actualizar "IP Invitado" en las reglas de reenvío de VirtualBox con la nueva IP |
| `EHOSTUNREACH` en Node.js | IP incorrecta en `index.js` o `enp0s8` DOWN en VM2 | Verificar que `host` sea `'192.168.100.10'` en `index.js` <br> `sudo ip link set enp0s8 up` |
| `ETIMEDOUT` en Node.js | `enp0s8` de VM1 DOWN o MariaDB rechaza conexiones | `sudo ip link set enp0s8 up && sudo ip addr add 192.168.100.10/24 dev enp0s8` <br> Verificar `bind-address = 0.0.0.0` |
| `Connection refused` en puerto 3306 | `enp0s8` de VM1 está caída | `sudo ip link set enp0s8 up` <br> `sudo ip addr add 192.168.100.10/24 dev enp0s8` |
| `Access Denied` en MariaDB | Usuario sin permisos o creado incorrectamente | `sudo mysql -u root` <br> `DROP USER 'usuario_consulta'@'%';` <br> `CREATE USER 'usuario_consulta'@'%' IDENTIFIED BY '123';` <br> `GRANT ALL PRIVILEGES ON instituto.* TO 'usuario_consulta'@'%';` <br> `FLUSH PRIVILEGES;` |
| Página no carga en navegador | Falta regla de reenvío de puertos para 8080 | Agregar regla en VirtualBox VM3: `127.0.0.1:8080 → 10.0.2.17:8080` |
| Error 403 Forbidden en Apache | Permisos incorrectos en la carpeta | `sudo chmod -R 755 /var/www/html/Sistema` <br> `sudo chown -R www-data:www-data /var/www/html/Sistema` |
| `netplan apply` da error de permisos | El archivo YAML tiene permisos muy abiertos | `sudo chmod 600 /etc/netplan/00-installer-config.yaml` |
| `enp0s8` vuelve a DOWN al reiniciar la VM | Las IPs manuales (`ip addr add`) no persisten | Verificar que el netplan esté bien escrito y aplicado. La solución definitiva es tener el netplan correcto, no el comando manual |
| El frontend muestra "Error conectando al servidor" | Backend no está corriendo en VM2 | Conectarse a VM2 y ejecutar: `node ~/backend/index.js` <br> Verificar también que la regla de reenvío del puerto 3454 exista en VM2 |

---

## Estructura final del proyecto

```
VM1 (MariaDB - 192.168.100.10)
├── Base de datos: instituto
└── Tabla: alumnos (id, apellidos, nombres, dni UNIQUE)

VM2 (Node.js - 192.168.100.20)
└── ~/backend/
    ├── index.js          ← el servidor Express
    ├── package.json
    └── node_modules/

VM3 (Apache - 192.168.100.30)
└── /var/www/html/
    └── Sistema/
        └── index.html    ← el frontend HTML+JS
```

---

