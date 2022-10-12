package console

import (
	"github.com/traefik/traefik/v2/frontend"
	"html/template"
	"net/http"
)

type Index struct {
	BasePath string `json:"basePath"`

	ConsoleVersion string `json:"consoleVersion"`
	GOARCH         string `json:"GOARCH"`
	GOOS           string `json:"GOOS"`

	// TODO: keycloak json 키 값이 대문자로 되어 있음 (UI랑 얘기해서 수정해야하는데 backward competability 고려하면 그냥 둬야할듯)
	KeycloakAuthURL  string `json:"KeycloakAuthURL"`
	KeycloakRealm    string `json:"KeycloakRealm"`
	KeycloakClientId string `json:"KeycloakClientId"`

	KubeAPIServerURL string `json:"kubeAPIServerURL"`

	PrometheusBaseURL        string `json:"prometheusBaseURL"`
	PrometheusTenancyBaseURL string `json:"prometheusTenancyBaseURL"`
	AlertManagerBaseURL      string `json:"alertManagerBaseURL"`

	McMode            bool   `json:"mcMode"`
	ChatbotEmbed      bool   `json:"chatbotEmbed"`
	CustomProductName string `json:"customProductName"`

	SvcType string `json:"svcType"`
}

func (index Index) indexHandler(w http.ResponseWriter, r *http.Request) {
	tpl := template.New(indexPageTemplateName)
	tpl.Delims("[[", "]]")
	tpls, err := tpl.ParseFS(frontend.FS, indexPageTemplateName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	if err := tpls.ExecuteTemplate(w, indexPageTemplateName, index); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
