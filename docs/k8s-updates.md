# Zero-Downtime K8s Updates

deployment.yaml spec.strategy.type: RollingUpdate
maxUnavailable: 0
maxSurge: 25%
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080  # adjust port if needed
  initialDelaySeconds: 10
  periodSeconds: 5

Apply: kubectl apply -f deployment.yaml
Monitor: kubectl rollout status deployment/astrafoge-deployment
