sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    function onAfterRendering(){
        var genericTileFirmarPedido = this.byId("linkFirmarPedido");
        var idGenericTileFirmarPedido = genericTileFirmarPedido.getId();
        jQuery("#"+idGenericTileFirmarPedido)[0].id = "";
    }

     function navToCreateEmployee (){
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("CreateEmployee", {}, false);
    }

    function navToShowEmployee (){
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("ShowEmployee", {}, false);
    }

    return Controller.extend("cac.employeesfinal.controller.Menu", {
        navToCreateEmployee : navToCreateEmployee,
        onAfterRendering    : onAfterRendering,
        navToShowEmployee   : navToShowEmployee
    });
});