terraform {
  required_version = ">= 1.5.0"

  required_providers {
    betteruptime = {
      source  = "BetterStackHQ/better-uptime"
      version = "0.21.13"
    }
  }
}

provider "betteruptime" {}

resource "betteruptime_monitor" "data_pipeline" {
  url                   = "https://northern-lights-tonight.vercel.app/api/health"
  pronounceable_name    = "Northern Lights data pipeline"
  monitor_type          = "status"
  check_frequency       = 300
  confirmation_period   = 600
  request_timeout       = 30
  follow_redirects      = true
  verify_ssl            = true
  email                 = true
}
