package console

import (
	"github.com/gorilla/mux"
	"github.com/traefik/traefik/v2/frontend"
	traefikversion "github.com/traefik/traefik/v2/pkg/version"
	"html/template"
	"net/http"
	"runtime"
)

const (
	indexPageTemplateName          = "index.html"
	prometheusProxyEndpoint        = "/api/prometheus"
	prometheusTenancyProxyEndpoint = "/api/prometheus-tenancy"
	alertManagerProxyEndpoint      = "/api/alertmanager"

	customProductName  = "hypercloud"
	traefikServiceType = "LoadBalancer"

	keycloakURL      = ""
	keycloakRealm    = "tmax"
	keycloakClientId = "hypercloud5"

	consoleBasePath    = "/"
	staticFileEndpoint = "/static/"
	ingressEndpoint    = "/api/kubernetes/"
)

type Handler struct {
	McMode            bool   `description:"Activate Multi-Cluster Mode" json:"mcMode" toml:"mcMode,omitempty" yaml:"mcMode,omitempty" export:"true"`
	ChatbotEmbed      bool   `description:"Activate Chatbot" json:"chatbotEmbed" toml:"chatbotEmbed,omitempty" yaml:"chatbotEmbed,omitempty" export:"true"`
	CustomProductName string `description:"Setting Custom Product Name" json:"customProductName" toml:"customProductName,omitempty" yaml:"customProductName,omitempty" export:"true"`

	SvcType string `json:"svcType"`

	KeycloakAuthURL  string `json:"keycloakAuthURL"`
	KeycloakRealm    string `json:"keycloakRealm"`
	KeycloakClientId string `json:"keycloakClientId"`

	KubeAPIServerURL string `json:"kubeAPIServerURL"`
}

// SetDefaults sets the default values.
func (h *Handler) SetDefaults() {
	h.McMode = true
	h.ChatbotEmbed = true
	h.CustomProductName = customProductName

	h.SvcType = traefikServiceType

	h.KeycloakAuthURL = keycloakURL
	h.KeycloakRealm = keycloakRealm
	h.KeycloakClientId = keycloakClientId
}

func (h *Handler) CreateRouter() *mux.Router {

	router := mux.NewRouter()

	// TODO: ingress endpoint 추가 하기
	//router.Methods(http.MethodGet).
	//	PathPrefix(ingressEndpoint).
	//	HandlerFunc(h.)

	router.Methods(http.MethodGet).
		PathPrefix(staticFileEndpoint).
		HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.StripPrefix(staticFileEndpoint, http.FileServer(http.FS(frontend.FS))).ServeHTTP(w, r)
		})

	router.Methods(http.MethodGet).
		PathPrefix(consoleBasePath).
		HandlerFunc(h.indexHandler)

	return router
}

type Index struct {
	BasePath string `json:"basePath"`

	ConsoleVersion string `json:"consoleVersion"`
	GOARCH         string `json:"GOARCH"`
	GOOS           string `json:"GOOS"`

	KeycloakAuthURL  string `json:"keycloakAuthURL"`
	KeycloakRealm    string `json:"keycloakRealm"`
	KeycloakClientId string `json:"keycloakClientId"`

	KubeAPIServerURL string `json:"kubeAPIServerURL"`

	PrometheusBaseURL        string `json:"prometheusBaseURL"`
	PrometheusTenancyBaseURL string `json:"prometheusTenancyBaseURL"`
	AlertManagerBaseURL      string `json:"alertManagerBaseURL"`

	McMode            bool   `json:"mcMode"`
	ChatbotEmbed      bool   `json:"chatbotEmbed"`
	CustomProductName string `json:"customProductName"`

	SvcType string `json:"svcType"`
}

func (h *Handler) indexHandler(w http.ResponseWriter, r *http.Request) {
	index := &Index{
		BasePath: consoleBasePath,

		ConsoleVersion: traefikversion.Version,
		GOARCH:         runtime.GOARCH,
		GOOS:           runtime.GOOS,

		KeycloakAuthURL:  h.KeycloakAuthURL,
		KeycloakRealm:    h.KeycloakRealm,
		KeycloakClientId: h.KeycloakClientId,

		KubeAPIServerURL: h.KubeAPIServerURL,

		SvcType: h.SvcType,

		PrometheusBaseURL:        prometheusProxyEndpoint,
		PrometheusTenancyBaseURL: prometheusTenancyProxyEndpoint,
		AlertManagerBaseURL:      alertManagerProxyEndpoint,

		McMode:            h.McMode,
		ChatbotEmbed:      h.ChatbotEmbed,
		CustomProductName: h.CustomProductName,
	}

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
