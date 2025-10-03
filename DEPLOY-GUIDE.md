# 🚀 GUÍA DE DEPLOY EN SERVIDOR

## 📋 Preparación para Deploy

### 1. Clonar desde GitHub
```bash
git clone https://github.com/eshe87-ciudad/ferreteria-control.git
cd ferreteria-control
```

### 2. Instalar dependencias
```bash
npm install
npm install -g pm2
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
nano .env  # Editar con tus credenciales
```

### 4. Configurar PM2 para producción
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 🌐 Configuración de Servidor (Ubuntu/CentOS)

### Instalar Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Instalar PM2
```bash
sudo npm install -g pm2
```

### Configurar Firewall
```bash
sudo ufw allow 3000
sudo ufw allow ssh
sudo ufw enable
```

### Configurar Nginx (Reverse Proxy)
```bash
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/mercadopago-webhook

# Contenido:
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activar sitio
sudo ln -s /etc/nginx/sites-available/mercadopago-webhook /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## 🔒 SSL con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

## 📊 Monitoreo con PM2 Plus (Opcional)
```bash
pm2 link your-secret-key your-public-key
```

## 🚀 Deploy Automático

### Script de deploy
```bash
#!/bin/bash
echo "🚀 Iniciando deploy..."

# Actualizar código
git pull origin main

# Instalar dependencias
npm install

# Reiniciar aplicación
pm2 restart all

echo "✅ Deploy completado"
```