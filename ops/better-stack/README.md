# Data-pipeline monitor

This Terraform configuration probes the lightweight `/api/health` endpoint every
five minutes. `confirmation_period = 600` delays incident creation until the
initial failure has also failed the next two checks, so a short-lived LKG handoff
does not page the team.

Set `BETTER_UPTIME_API_TOKEN` to a Better Stack Uptime API token, then run:

```bash
terraform init
terraform apply
```

The monitor treats only HTTP 2xx as healthy. The endpoint returns 503 when the
runtime falls back to the bundled snapshot or every location is `UNKNOWN`.
