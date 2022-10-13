package console

import (
	"github.com/gorilla/mux"
	"testing"
)

// TODO: handler test
// TODO: RED, GREEN, REFACTOR
func Test_CreateRouter(t *testing.T) {
	t.Parallel()

	var registered = []struct {
		route   string
		methode string
	}{
		{"/", "GET"},
		{"/static/", "GET"},
	}

	var console Console
	cMux := console.CreateRouter()

	for _, route := range registered {
		// check to see if the route exists
		if !routeExists(route.route, route.methode, cMux) {
			t.Errorf("route %s is not registered", route.route)
		}
	}
}

func routeExists(testRoute, testMethod string, gMux *mux.Router) bool {
	muxRouteMethod := make(map[string][]string)
	gMux.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		routePath, _ := route.GetPathTemplate()
		routeMethod, _ := route.GetMethods()
		muxRouteMethod[routePath] = routeMethod
		return nil
	})
	if _, ok := muxRouteMethod[testRoute]; !ok {
		return false
	}
	return true
}
