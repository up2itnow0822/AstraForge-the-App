# A/B Testing in AstraForge

## Quantum vs Classical

Use Istio virtualservice for traffic split:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: astraforge
spec:
  hosts:
  - astraforge
  http:
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: astraforge-classical
        subset: blue
      weight: 90
    - destination:
        host: astraforge-quantum
        subset: green
      weight: 10
```

Canary toggle via `kubectl patch virtualservice astraforge -p '{"spec":{"http":[{"route":[{"destination":{"host":"astraforge-classical","subset":"blue"},"weight":100},{"destination":{"host":"astraforge-quantum","subset":"green"},"weight":0}]}]}}'`. Blue-green deployment in K8s:

Deployment spec: `strategy: type: RollingUpdate, rollingUpdate: maxUnavailable: 0, maxSurge: 25%`. Promote blue to green post >50% win rate by monitoring abWin metric.

Test 10% traffic to quantum (adjust weights), fallback to classical if quantum success <50% (abWin <50).

## Monitoring
Watch `abWin` metric: >50% promote green deployment via Istio weight switch to 100% green; <50% rollback weights to 100% blue.
