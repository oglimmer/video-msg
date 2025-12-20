# Screen Recording Tool Helm Chart

This Helm chart deploys the screen recording with audio commentary tool with both backend (Java/Spring Boot) and frontend (Vue/Nginx) components.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- An existing MariaDB database
- Traefik or another ingress controller installed
- cert-manager for TLS certificates (optional)

## Installing the Chart

To install the chart with the release name `video-msg`:

```bash
helm install video-msg ./helm/video-msg
```

### Custom Values

You can customize the installation by providing your own values:

```bash
helm install video-msg ./helm/video-msg \
  --set database.external.host=your-mariadb-host \
  --set database.external.password=your-secure-password \
  --set ingress.hosts[0].host=your-domain.com
```

Or create a `custom-values.yaml` file:

```yaml
database:
  external:
    host: mariadb.database.svc.cluster.local
    password: secure-password

ingress:
  hosts:
    - host: vmsg.example.com
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

backend:
  image:
    repository: your-registry/video-msg-backend
    tag: "1.0.0"
  persistence:
    size: 100Gi  # Adjust based on expected video storage needs

frontend:
  image:
    repository: your-registry/video-msg-frontend
    tag: "1.0.0"
```

Then install with:

```bash
helm install video-msg ./helm/video-msg -f custom-values.yaml
```

## Configuration

The following table lists the configurable parameters of the screen recording tool chart and their default values.

### Global Parameters

| Parameter      | Description                        | Default |
| -------------- | ---------------------------------- | ------- |
| `replicaCount` | Number of replicas for deployments | `1`     |

### Backend Parameters

| Parameter                          | Description                             | Default                              |
| ---------------------------------- | --------------------------------------- | ------------------------------------ |
| `backend.image.repository`         | Backend image repository                | `registry.oglimmer.com/video-msg-be` |
| `backend.image.tag`                | Backend image tag                       | `latest`                             |
| `backend.image.pullPolicy`         | Image pull policy                       | `Always`                             |
| `backend.service.type`             | Kubernetes service type                 | `ClusterIP`                          |
| `backend.service.port`             | Service port                            | `8080`                               |
| `backend.javaOpts`                 | Java JVM options                        | See values.yaml                      |
| `backend.persistence.enabled`      | Enable persistent storage for videos    | `true`                               |
| `backend.persistence.size`         | Persistent volume size                  | `50Gi`                               |
| `backend.persistence.storageClass` | Storage class name                      | `""`                                 |
| `backend.persistence.mountPath`    | Mount path for video storage            | `/app/video-storage`                 |

### Frontend Parameters

| Parameter                   | Description               | Default                              |
| --------------------------- | ------------------------- | ------------------------------------ |
| `frontend.image.repository` | Frontend image repository | `registry.oglimmer.com/video-msg-fe` |
| `frontend.image.tag`        | Frontend image tag        | `latest`                             |
| `frontend.image.pullPolicy` | Image pull policy         | `Always`                             |
| `frontend.service.type`     | Kubernetes service type   | `ClusterIP`                          |
| `frontend.service.port`     | Service port              | `80`                                 |

### Database Parameters

| Parameter                    | Description           | Default         |
| ---------------------------- | --------------------- | --------------- |
| `database.external.enabled`  | Use external database | `true`          |
| `database.external.host`     | Database host         | `mariadb`       |
| `database.external.port`     | Database port         | `3306`          |
| `database.external.name`     | Database name         | `video-message` |
| `database.external.user`     | Database user         | `video-message` |
| `database.external.password` | Database password     | `video-message` |

### Ingress Parameters

| Parameter                 | Description                 | Default                |
| ------------------------- | --------------------------- | ---------------------- |
| `ingress.enabled`         | Enable ingress              | `true`                 |
| `ingress.annotations`     | Ingress annotations         | cert-manager issuer    |
| `ingress.hosts`           | Ingress hosts configuration | vmsg.oglimmer.com      |
| `ingress.tls`             | TLS configuration           | tls-vmsg-ingress-dns   |

## Uninstalling the Chart

To uninstall/delete the `video-msg` deployment:

```bash
helm uninstall video-msg
```

**Note:** This will not delete the PersistentVolumeClaim containing video recordings. To delete it:

```bash
kubectl delete pvc video-msg-video-storage
```

## Upgrading the Chart

To upgrade the `video-msg` deployment:

```bash
helm upgrade video-msg ./helm/video-msg
```

To force pod recreation (e.g., after updating secrets):

```bash
helm upgrade video-msg ./helm/video-msg --recreate-pods
```

## Using with cert-manager

This chart is configured to work with cert-manager for automatic TLS certificate provisioning:

```yaml
ingress:
  annotations:
    cert-manager.io/cluster-issuer: "oglimmer-com-dns"
  tls:
    - secretName: tls-vmsg-ingress-dns
      hosts:
        - vmsg.oglimmer.com
```

## Health Checks

The backend includes comprehensive health checks:

- Startup probe: `GET /actuator/health` (initialDelaySeconds: 10, failureThreshold: 30)
- Liveness probe: `GET /actuator/health` (periodSeconds: 10)
- Readiness probe: `GET /actuator/health` (periodSeconds: 5)

The frontend includes basic HTTP checks on the root path.

## Persistent Storage

The backend requires persistent storage for video recordings. By default, a PersistentVolumeClaim is created with 50Gi storage. Video files can be large, so adjust the size based on expected usage:

```yaml
backend:
  persistence:
    enabled: true
    size: 100Gi
    storageClass: "fast-ssd"
```

Videos are stored in a date-based directory structure: `YYYY/MM/DD/{uuid}.webm`

## Security

The chart includes security best practices:

- Non-root user execution (UID 10001)
- Security contexts configured
- Service account with minimal permissions
- Secrets for sensitive database credentials
- Read-only root filesystem disabled (required for video storage)
- All capabilities dropped

## Troubleshooting

### Check pod status

```bash
kubectl get pods -l app.kubernetes.io/name=video-msg
```

### View logs

```bash
kubectl logs -l app.kubernetes.io/name=video-msg-backend
kubectl logs -l app.kubernetes.io/name=video-msg-frontend
```

### Check persistent volume

```bash
kubectl get pvc
kubectl describe pvc video-msg-video-storage
```

### Test database connectivity

```bash
kubectl exec -it <backend-pod> -- env | grep SPRING_DATASOURCE
```

### Check ingress

```bash
kubectl get ingress
kubectl describe ingress video-msg
```

### Test video upload

```bash
# Port-forward the backend
kubectl port-forward svc/video-msg-backend 8080:8080

# Upload a test video
curl -X POST -F "video=@test.webm" http://localhost:8080/api/recordings
```

### Common Issues

**Pod stuck in Pending state:**
- Check if PVC can be bound: `kubectl describe pvc video-msg-video-storage`
- Verify storage class exists: `kubectl get storageclass`

**Backend unable to start:**
- Check database connectivity
- Verify database credentials in secret
- Check if database schema is initialized

**Videos not persisting:**
- Verify PVC is mounted: `kubectl describe pod <backend-pod>`
- Check volume mount permissions (should be writable by UID 10001)

**Ingress not working:**
- Verify cert-manager is installed and cluster-issuer exists
- Check ingress controller logs
- Verify DNS points to ingress controller
