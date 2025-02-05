sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
	"sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"


], function (Controller,History, Filter, FilterOperator ) {
	"use strict";
	
	function onInit(){
		this._splitAppEmployee = this.byId("splitAppEmployee");
	}
	
	//Función al pulsar "<" para regresar al menú
	function onPressBack(){
			// vamos al menu
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("menu", {}, true);
	}
	
	//Función para filtrar empleados
	function onSearchEmployee(){
		var itemSearch = this.getView().byId("search").getValue();
        var filters = [];
		if (itemSearch) {

			// Crear filtros para FirstName y LastName
			var filterFirstName = new sap.ui.model.Filter("FirstName", sap.ui.model.FilterOperator.Contains, itemSearch);
			var filterLastName  = new sap.ui.model.Filter("LastName", sap.ui.model.FilterOperator.Contains, itemSearch);
			var filterID       = new sap.ui.model.Filter("Dni", sap.ui.model.FilterOperator.Contains, itemSearch);
	     
			     // Combinar los filtros con OR
				 filters.push(new sap.ui.model.Filter({
					filters: [filterFirstName, filterLastName, filterID],
					and: false // Usar OR para combinar los filtros
				}));
			}		
		var oList = this.getView().byId("tableEmployees");
        var oBinding = oList.getBinding("items");
        oBinding.filter(filters);
	}
	
	//Función al seleccionar un empleado
	function onSelectEmployee(oEvent){
		this._splitAppEmployee.to(this.createId("detailEmployee"));
		var context = oEvent.getParameter("listItem").getBindingContext("odataModel");
		this.employeeId = context.getProperty("EmployeeId");
		var detailEmployee = this.byId("detailEmployee");
		//Se bindea a la vista con la entidad Users y las claves del id del empleado y el id del alumno
		detailEmployee.bindElement("odataModel>/Users(EmployeeId='"+ this.employeeId +"',SapId='"+this.getOwnerComponent().SapId+"')");
	}
	
	//Función para eliminar el empleado seleccionado
	function onDeleteEmployee(oEvent){
		//Se muestra un mensaje de confirmación
		sap.m.MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("estaSeguroEliminar"),{
			title : this.getView().getModel("i18n").getResourceBundle().getText("confirm"),
			onClose : function(oAction){
			    	if(oAction === "OK"){
			    		//Se llama a la función remove
						this.getView().getModel("odataModel").remove("/Users(EmployeeId='" + this.employeeId + "',SapId='"+this.getOwnerComponent().SapId+"')",{
							success : function(data){
								sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("seHaEliminadoUsuario"));
								//En el detalle se muestra el mensaje "Seleecione empleado"
								this._splitAppEmployee.to(this.createId("detailSelectEmployee"));
							}.bind(this),
							error : function(e){
								sap.base.Log.info(e);
							}.bind(this)
						});
			    	}
			}.bind(this)
		});
	}
	
	//Función para ascender a un empleado
	function onRiseEmployee(oEvent){
		if(!this.riseDialog){
			this.riseDialog = sap.ui.xmlfragment("cac/employeesfinal/fragment/RiseEmployee", this);
			this.getView().addDependent(this.riseDialog);
		}
		this.riseDialog.setModel(new sap.ui.model.json.JSONModel({}),"newRise");
		this.riseDialog.open();
	}
	
	//Función para cerrar el dialogo
	function onCloseRiseDialog(){
		this.riseDialog.close();
	}
	
	//Función para crear un nuevo ascenso
	function addRise(oEvent){
		var newRise = this.riseDialog.getModel("newRise");
		//Se obtiene los datos
		var odata = newRise.getData();
		var body = {
			Amount : odata.Ammount,
			CreationDate : odata.CreationDate,
			Comments : odata.Comments,
			SapId : this.getOwnerComponent().SapId,
			EmployeeId : this.employeeId
		};
		this.getView().setBusy(true);
		this.getView().getModel("odataModel").create("/Salaries",body,{
			success : function(){
				this.getView().setBusy(false);
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ascensoCorrectamente"));
				this.onCloseRiseDialog();
			}.bind(this),
			error : function(){
                this.getView().setBusy(false);
                sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ascensoErroneo"));
			}.bind(this)
		});
    }

	function onChange (oEvent) {
	   var oUploadCollection = oEvent.getSource();
	   // Header Token
	   var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
	    name: "x-csrf-token",
	    value: this.getView().getModel("odataModel").getSecurityToken()
	   });
	   oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
	 }
	
	//Función que se ejecuta por cada fichero que se va a subir a sap
	 function onBeforeUploadStart (oEvent) {
	   var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: this.getOwnerComponent().SapId+";"+this.employeeId+";"+oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
      }
    
      function onUploadComplete (oEvent) {
        var oUploadCollection = oEvent.getSource();
        oUploadCollection.getBinding("items").refresh();
    }

    function onFileDeleted(oEvent){
        var oUploadCollection = oEvent.getSource();
        var sPath = oEvent.getParameter("item").getBindingContext("odataModel").getPath();
        this.getView().getModel("odataModel").remove(sPath, {
            success: function(){
                oUploadCollection.getBinding("items").refresh();
            },
            error: function(){

            }
        });
    }

    function downloadFile(oEvent){
        var sPath = oEvent.getSource().getBindingContext("odataModel").getPath();
        window.open("/sap/opu/odata/sap/ZEMPLOYEES_SRV"+sPath+"/$value");
    }

	return Controller.extend("cac.employeesfinal.controller.ShowEmployee", {
		onInit: onInit,
		onPressBack : onPressBack,
		onSearchEmployee : onSearchEmployee,
		onSelectEmployee : onSelectEmployee,
		onDeleteEmployee : onDeleteEmployee,
		onRiseEmployee : onRiseEmployee,
		onCloseRiseDialog : onCloseRiseDialog,
        addRise : addRise,
        onChange : onChange,
        onBeforeUploadStart : onBeforeUploadStart,
        onUploadComplete : onUploadComplete,
        onFileDeleted : onFileDeleted,
        downloadFile : downloadFile
	});
});