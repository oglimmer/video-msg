{{/*
Expand the name of the chart.
*/}}
{{- define "video-msg.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "video-msg.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "video-msg.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "video-msg.labels" -}}
helm.sh/chart: {{ include "video-msg.chart" . }}
{{ include "video-msg.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "video-msg.selectorLabels" -}}
app.kubernetes.io/name: {{ include "video-msg.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend specific labels
*/}}
{{- define "video-msg.backend.labels" -}}
helm.sh/chart: {{ include "video-msg.chart" . }}
{{ include "video-msg.backend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "video-msg.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "video-msg.name" . }}-backend
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend specific labels
*/}}
{{- define "video-msg.frontend.labels" -}}
helm.sh/chart: {{ include "video-msg.chart" . }}
{{ include "video-msg.frontend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "video-msg.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "video-msg.name" . }}-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "video-msg.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "video-msg.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database host
*/}}
{{- define "video-msg.database.host" -}}
{{- if .Values.database.external.enabled }}
{{- .Values.database.external.host }}
{{- end }}
{{- end }}

{{/*
Database port
*/}}
{{- define "video-msg.database.port" -}}
{{- if .Values.database.external.enabled }}
{{- .Values.database.external.port }}
{{- end }}
{{- end }}

{{/*
Database name
*/}}
{{- define "video-msg.database.name" -}}
{{- if .Values.database.external.enabled }}
{{- .Values.database.external.name }}
{{- end }}
{{- end }}

{{/*
Backend fullname
*/}}
{{- define "video-msg.backend.fullname" -}}
{{- printf "%s-backend" (include "video-msg.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Frontend fullname
*/}}
{{- define "video-msg.frontend.fullname" -}}
{{- printf "%s-frontend" (include "video-msg.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
