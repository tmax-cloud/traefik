package console

import (
	"encoding/json"
	"github.com/traefik/traefik/v2/frontend"
	"github.com/traefik/traefik/v2/pkg/log"
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

// the function that return http response containing json body of Console struct
func (index Index) jsonHandler(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err := json.NewEncoder(w).Encode(index)
	if err != nil {
		log.FromContext(req.Context()).Warnf("Could not Encode json %s", req.Host)
	}

}

func (index Index) htmlHandler(w http.ResponseWriter, r *http.Request) {
	tpl := template.New(indexPageTemplateName)
	//tpl.Delims("[[", "]]")
	tpls, err := tpl.ParseFS(frontend.FS, indexPageTemplateName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	if err := tpls.ExecuteTemplate(w, indexPageTemplateName, index); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
