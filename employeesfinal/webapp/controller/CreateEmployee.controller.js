sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";
    
    function onBeforeRendering(){
		this._wizard = this.byId("wizard");
		this._model = new sap.ui.model.json.JSONModel({});
		this.getView().setModel(this._model);
		var oFirstStep = this._wizard.getSteps()[0];
		this._wizard.discardProgress(oFirstStep);
		this._wizard.goToStep(oFirstStep);
		oFirstStep.setValidated(false);

	}

    function goToStep2 (oEvent){
        //Valor Paso 1
        var employeeType = this.byId("employeeType");
         //Valor Paso 2
        var employeeData = this.byId("employeeData");
        
        //Se obtiene el tipo seleccionado con el "CustomData"
		var button = oEvent.getSource();
		var typeEmployee = button.data("typeEmployee");
		
		var Salary,Type;
		switch(typeEmployee){
			case "interno":
				Salary = 24000;
				Type = "0";
				break;
			case "autonomo":
				Salary = 400;
				Type = "1";
				break;
			case "gerente":
				Salary = 70000;
				Type = "2";
				break;
			default:
				break;
		}
		
		//Al pulsar sobre el tipo, se sobreescribe el modelo registrando el tipo  y el valor del salario por defecto
		this._model.setData({
			_type : typeEmployee,
			Type : Type,
			_Salary : Salary
		});
		
		if(this._wizard.getCurrentStep() === employeeType.getId()){
			this._wizard.nextStep();
		}else{
			this._wizard.goToStep(employeeData);
		}
    }

    function goToStep3 (){
        //Valor Paso 2
        var employeeData = this.byId("employeeData");
         //Valor Paso 3
        var employeeInfo = this.byId("employeeInfo");

		if(this._wizard.getCurrentStep() === employeeData.getId()){
			this._wizard.nextStep();
		}else{
			this._wizard.goToStep(employeeInfo);
		}
    }

	function validateDNI(oEvent){
		//Se comprueba si es dni o cif. En caso de dni, se comprueba su valor. Para ello se comprueba que el tipo no sea "autonomo"
		if(this._model.getProperty("_type") !== "autonomo"){
			var dni = oEvent.getParameter("value");
			var number;
			var letter;
			var letterList;
			var regularExp = /^\d{8}[a-zA-Z]$/;
			//Se comprueba que el formato es válido
			if(regularExp.test (dni) === true){
				//Número
				 number = dni.substr(0,dni.length-1);
				 //Letra
				 letter = dni.substr(dni.length-1,1);
				 number = number % 23;
				 letterList="TRWAGMYFPDXBNJZSQVHLCKET";
				 letterList=letterList.substring(number,number+1);
			if (letterList !== letter.toUpperCase()) {
				this._model.setProperty("/_DniState","Error");
			 }else{
				this._model.setProperty("/_DniState","None");
				this.dataEmployeeValidation();
			 }
			}else{
				this._model.setProperty("/_DniState","Error");
			}
		}
	}
    
	function dataEmployeeValidation(oEvent,callback) {
		var object = this._model.getData();
		var isValid = true;
		//Nombre
		if(!object.FirstName){
			object._FirstNameState = "Error";
			isValid = false;
		}else{
			object._FirstNameState = "None";
		}
		
		//Apellidos
		if(!object.LastName){
			object._LastNameState = "Error";
			isValid = false;
		}else{
			object._LastNameState = "None";
		}
		
		//Fecha
		if(!object.CreationDate){
			object._CreationDateState = "Error";
			isValid = false;
		}else{
			object._CreationDateState = "None";
		}
		
		//DNI
		if(!object.Dni){
			object._DniState = "Error";
			isValid = false;
		}else{
			object._DniState = "None";
		}

		if(isValid) {
			this._wizard.validateStep(this.byId("employeeData"));
		} else {
			this._wizard.invalidateStep(this.byId("employeeData"));
		}
		//Si hay callback se devuelve el valor isValid
		if(callback){
			callback(isValid);
		}
	}
    
	function wizardCompletedHandler(oEvent){
		//Se comprueba que no haya error
		this.dataEmployeeValidation(oEvent,function(isValid){
			if(isValid){
				//Se navega a la página review
				var wizardNavContainer = this.byId("wizardNavContainer");
				wizardNavContainer.to(this.byId("ReviewPage"));
				//Se obtiene los archivos subidos
				var uploadCollection = this.byId("UploadCollection");
				var files = uploadCollection.getItems();
				var numFiles = uploadCollection.getItems().length;
				this._model.setProperty("/_numFiles",numFiles);
				if (numFiles > 0) {
					var arrayFiles = [];
					for(var i in files){
						arrayFiles.push({DocName:files[i].getFileName(),MimeType:files[i].getMimeType()});	
					}
					this._model.setProperty("/_files",arrayFiles);
				}else{
					this._model.setProperty("/_files",[]);
				}
			}else{
				this._wizard.goToStep(this.byId("employeeData"));
			}
		}.bind(this));
	}

    function goToReviewPage (){
        var wizardNavContainer = this.byId("wizardNavContainer");
        wizardNavContainer.to(this.byId("ReviewPage"));
    }

	function _editStep(step){
		var wizardNavContainer = this.byId("wizardNavContainer");
		var fnAfterNavigate = function () {
				this._wizard.goToStep(this.byId(step));
				wizardNavContainer.detachAfterNavigate(fnAfterNavigate);
			}.bind(this);

		wizardNavContainer.attachAfterNavigate(fnAfterNavigate);
		wizardNavContainer.back();
	}
	
	//Función al darle al botón editar de la sección "Tipo de empleado"
	function editStepOne(){
		_editStep.bind(this)("employeeType");
	}
	
	//Función al darle al botón editar de la sección "Datos de empleado"
	function editStepTwo(){
		_editStep.bind(this)("employeeData");
	}
	
	//Función al darle al botón editar de la sección "Información adicional"
	function editStepThree(){
		_editStep.bind(this)("employeeInfo");
	}
	
	//Función para guardar el nuevo empleado
	function onSaveEmployee(){
		var json = this.getView().getModel().getData();
		var body = {};
		for(var i in json){
			if(i.indexOf("_") !== 0){
				body[i] = json[i];
			}
		}
        body.SapId = this.getOwnerComponent().SapId;
		body.UserToSalary = [{
			Amount :  parseFloat(json._Salary).toString(),
			Comments : json.Comments,
			Waers : "EUR"
		}];
		this.getView().setBusy(true);
		this.getView().getModel("odataModel").create("/Users",body,{
			success : function(data){
				this.getView().setBusy(false);
				this.newUser = data.EmployeeId;
				sap.m.MessageBox.information(this.oView.getModel("i18n").getResourceBundle().getText("empleadoNuevo") + ": " + this.newUser,{
					onClose : function(){
						//Se vuelve al wizard, para que al vovler a entrar a la aplicacion aparezca ahi
						var wizardNavContainer = this.byId("wizardNavContainer");
						wizardNavContainer.back();
						var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
						//Se navega hacia el router "menu"
						oRouter.navTo("menu",{},true);
					}.bind(this)
				});
				//Se llama a la función "upload" del uploadCollection
				this.onStartUpload();
			}.bind(this),
			error : function(){
				this.getView().setBusy(false);
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
	
	 function onBeforeUploadStart (oEvent) {
	   var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: this.getOwnerComponent().SapId+";"+this.newUser+";"+oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
	  }
	  
	  function onStartUpload (ioNum) {
	   var that = this;
	   var oUploadCollection = that.byId("UploadCollection");
	   oUploadCollection.upload();
	  }
    
    //Cancelar Creación del empleado
    function onCancel (){
        sap.m.MessageBox.confirm(this.oView.getModel("i18n").getResourceBundle().getText("cancelConfirmation"),{
			onClose : function(oAction){
		    	if(oAction === "OK"){
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.navTo("menu",{},true);
		    	}
			}.bind(this)
		});
    }

    return Controller.extend("cac.employeesfinal.controller.CreateEmployee", {
        goToStep2       : goToStep2,
        onBeforeRendering : onBeforeRendering,
        goToStep3      : goToStep3,
        goToReviewPage : goToReviewPage,
        onCancel       : onCancel,
		validateDNI    : validateDNI,
		dataEmployeeValidation : dataEmployeeValidation,
		wizardCompletedHandler : wizardCompletedHandler,
		editStepOne     : editStepOne,
		editStepTwo     : editStepTwo,
		editStepThree   : editStepThree,
		onSaveEmployee  : onSaveEmployee,
		onChange        : onChange,
		onBeforeUploadStart : onBeforeUploadStart,
		onStartUpload   : onStartUpload
    });
});