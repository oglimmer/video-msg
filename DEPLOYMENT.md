# Video Message Application - Deployment Guide

This guide covers deploying the Video Message application using Docker and Kubernetes (via Helm).

## Table of Contents

1. [Local Development with Docker Compose](#local-development-with-docker-compose)
2. [Building Docker Images](#building-docker-images)
3. [Kubernetes Deployment with Helm](#kubernetes-deployment-with-helm)
4. [Configuration](#configuration)
5. [Troubleshooting](#troubleshooting)

## Local Development with Docker Compose

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Quick Start

1. Build and start all services:

```bash
docker-compose -f docker-compose.local.yml up --build
```

2. Access the application:

- Frontend: http://localhost:8081
- Backend API: http://localhost:8080/api
- Health Check: http://localhost:8080/actuator/health

3. Stop all services:

```bash
docker-compose -f docker-compose.local.yml down
```

### Rebuild Individual Services

```bash
# Rebuild backend only
docker-compose -f docker-compose.local.yml up --build backend

# Rebuild frontend only
docker-compose -f docker-compose.local.yml up --build frontend
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.local.yml logs -f

# Backend only
docker-compose -f docker-compose.local.yml logs -f backend

# Frontend only
docker-compose -f docker-compose.local.yml logs -f frontend
```

## Building Docker Images

### Backend Image

```bash
cd backend
docker build -t registry.oglimmer.com/video-msg-be:latest .
docker push registry.oglimmer.com/video-msg-be:latest
```

### Frontend Image

```bash
cd frontend
docker build -t registry.oglimmer.com/video-msg-fe:latest .
docker push registry.oglimmer.com/video-msg-fe:latest
```

### Building with Specific Tags

```bash
# Backend with version tag
docker build -t registry.oglimmer.com/video-msg-be:1.0.0 ./backend
docker push registry.oglimmer.com/video-msg-be:1.0.0

# Frontend with version tag
docker build -t registry.oglimmer.com/video-msg-fe:1.0.0 ./frontend
docker push registry.oglimmer.com/video-msg-fe:1.0.0
```

## Kubernetes Deployment with Helm

### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.0+
- kubectl configured to access your cluster
- MariaDB instance accessible from cluster
- Ingress controller (e.g., Traefik)
- cert-manager (optional, for TLS)

### Installation

#### 1. Create Namespace (Optional)

```bash
kubectl create namespace video-msg
```

#### 2. Set Up Image Pull Secrets

If using a private registry:

```bash
kubectl create secret docker-registry oglimmerregistrykey \
  --docker-server=registry.oglimmer.com \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email> \
  -n video-msg
```

#### 3. Install with Default Values

```bash
helm install video-msg ./helm/video-msg -n video-msg
```

#### 4. Install with Custom Values

Create a `custom-values.yaml`:

```yaml
database:
  external:
    host: mariadb.database.svc.cluster.local
    user: video-message
    password: "your-secure-password"

ingress:
  hosts:
    - host: vmsg.yourdomain.com
      paths:
        - path: /api
          pathType: Prefix
          backend: api
        - path: /actuator
          pathType: Prefix
          backend: api
        - path: /
          pathType: Prefix
          backend: web
  tls:
    - secretName: tls-vmsg-ingress
      hosts:
        - vmsg.yourdomain.com

backend:
  persistence:
    size: 100Gi
    storageClass: "fast-ssd"
  image:
    tag: "1.0.0"

frontend:
  image:
    tag: "1.0.0"
```

Install with custom values:

```bash
helm install video-msg ./helm/video-msg -n video-msg -f custom-values.yaml
```

### Upgrading

```bash
# Upgrade with new image tags
helm upgrade video-msg ./helm/video-msg -n video-msg \
  --set backend.image.tag=1.0.1 \
  --set frontend.image.tag=1.0.1

# Upgrade with custom values file
helm upgrade video-msg ./helm/video-msg -n video-msg -f custom-values.yaml
```

### Uninstalling

```bash
helm uninstall video-msg -n video-msg
```

**Note:** This preserves the PersistentVolumeClaim. To delete it:

```bash
kubectl delete pvc video-msg-video-storage -n video-msg
```

## Configuration

### Environment Variables (Backend)

| Variable                     | Description                  | Default               |
| ---------------------------- | ---------------------------- | --------------------- |
| `SPRING_DATASOURCE_URL`      | Database JDBC URL            | See values.yaml       |
| `SPRING_DATASOURCE_USERNAME` | Database username            | From secret           |
| `SPRING_DATASOURCE_PASSWORD` | Database password            | From secret           |
| `JAVA_OPTS`                  | JVM options                  | `-Xmx1536m -Xms768m`  |
| `FILE_STORAGE_BASE_DIRECTORY`| Video storage directory      | `/app/video-storage`  |

### Database Setup

Before deploying, ensure your MariaDB database is set up:

```sql
CREATE DATABASE IF NOT EXISTS `video-message`;
CREATE USER IF NOT EXISTS 'video-message'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON `video-message`.* TO 'video-message'@'%';
FLUSH PRIVILEGES;
```

The application will automatically create tables on first startup.

### Storage Configuration

The backend requires persistent storage for video files. Ensure your Kubernetes cluster has:

- A StorageClass that supports ReadWriteOnce access
- Sufficient storage quota for video files (50Gi+ recommended)

Check available storage classes:

```bash
kubectl get storageclass
```

## Troubleshooting

### Docker Compose Issues

**Backend won't start:**

```bash
# Check logs
docker-compose -f docker-compose.local.yml logs backend

# Common issues:
# - Database not ready: wait 30-60 seconds after first start
# - Port conflict: change port in docker-compose.local.yml
```

**Database connection refused:**

```bash
# Verify MariaDB is running
docker-compose -f docker-compose.local.yml ps mariadb

# Check MariaDB logs
docker-compose -f docker-compose.local.yml logs mariadb
```

### Kubernetes Issues

**Pods not starting:**

```bash
# Check pod status
kubectl get pods -n video-msg

# Describe pod for events
kubectl describe pod <pod-name> -n video-msg

# Check logs
kubectl logs <pod-name> -n video-msg
```

**PVC stuck in Pending:**

```bash
# Check PVC status
kubectl describe pvc video-msg-video-storage -n video-msg

# Common causes:
# - No available PV
# - StorageClass doesn't exist
# - Insufficient storage quota
```

**Ingress not working:**

```bash
# Check ingress
kubectl get ingress -n video-msg
kubectl describe ingress video-msg -n video-msg

# Verify cert-manager issued certificate
kubectl get certificate -n video-msg
kubectl describe certificate -n video-msg
```

**Database connection errors:**

```bash
# Verify secret exists
kubectl get secret video-msg-secret -n video-msg

# Check environment variables in pod
kubectl exec -it <backend-pod> -n video-msg -- env | grep SPRING_DATASOURCE

# Test database connectivity
kubectl run -it --rm debug --image=mariadb:10.11 --restart=Never -n video-msg -- \
  mysql -h mariadb -u video-message -p video-message
```

### Application Issues

**Videos not uploading:**

- Check backend logs for errors
- Verify PVC is mounted and writable
- Check disk space: `kubectl exec <backend-pod> -n video-msg -- df -h`

**Videos not playing:**

- Check if file exists in storage
- Verify MIME type is set correctly in database
- Check browser console for errors

**High memory usage:**

- Adjust `JAVA_OPTS` in values.yaml
- Monitor with: `kubectl top pods -n video-msg`
- Consider increasing resource limits

## Monitoring

### Health Checks

```bash
# Backend health
curl https://vmsg.oglimmer.com/actuator/health

# Via kubectl
kubectl exec <backend-pod> -n video-msg -- curl localhost:8080/actuator/health
```

### Resource Usage

```bash
# Pod resource usage
kubectl top pods -n video-msg

# Node resource usage
kubectl top nodes
```

### Storage Usage

```bash
# Check PVC usage
kubectl exec <backend-pod> -n video-msg -- du -sh /app/video-storage

# Check database size
kubectl run -it --rm debug --image=mariadb:10.11 --restart=Never -n video-msg -- \
  mysql -h mariadb -u video-message -p -e \
  "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'video-message' GROUP BY table_schema;"
```

## Production Checklist

- [ ] Use specific image tags (not `latest`)
- [ ] Set secure database password
- [ ] Configure proper storage class and size
- [ ] Set up TLS with cert-manager
- [ ] Configure resource limits and requests
- [ ] Set up monitoring and alerting
- [ ] Configure backup for database and videos
- [ ] Test disaster recovery procedures
- [ ] Review security settings (non-root users, capabilities)
- [ ] Set up log aggregation
- [ ] Configure ingress rate limiting
- [ ] Test horizontal scaling if needed
