// Este código asume que ya has inicializado Firebase en tu HTML.
// Configuración de Firebase
var firebaseConfig = {
  apiKey: "AIzaSyCwD-hcUn3fn7MYgPZ_AOb9lGTDUVd8Ju8",
  authDomain: "formulario-if---ft.firebaseapp.com",
  projectId: "formulario-if---ft",
  storageBucket: "formulario-if---ft.appspot.com",
  messagingSenderId: "1058547807066",
  appId: "1:1058547807066:web:4c7a3f5e5effd7d2dcf963",
  measurementId: "G-LPNRPXMJLY"
};
// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
  // Establecer la fecha actual
  const dateInput = document.getElementById('date');
  dateInput.value = new Date().toLocaleDateString('es-MX');

  // Función para generar un nuevo folio
  const generateFolio = async () => {
    // Aquí se supone que tienes una colección 'settings' donde guardas el último folio usado.
    const folioDoc = await db.collection('settings').doc('folio').get();
    const folioData = folioDoc.data();
    const newFolio = (folioData.currentFolio || 0) + 1;
    
    // Actualizar el folio en la base de datos
    await db.collection('settings').doc('folio').set({ currentFolio: newFolio });

    return newFolio;
  };

  // Asignar el nuevo folio
  generateFolio().then(newFolio => {
    const folioInput = document.getElementById('folio');
    folioInput.value = newFolio;
  }).catch(error => {
    console.error('Error generando el folio: ', error);
  });

  // Lógica para manejar las listas desplegables dependientes
  const areaSelect = document.getElementById('area');
  const budgetItemSelect = document.getElementById('budgetItem');
  const emailField = document.getElementById('correo'); 

  const areaToBudgetItems = {
      'Comercial': {
        "Licencia de Xtract (Ventas)": "edelgado@biancorelab.com",
        "Asociacion de Nacional de Tiendas y Autoservicios departamentales": "carlos@biancorelab.com",
        "Asociación Mexicana de Estándares para el Comercio Electrónico, Asociación Civil": "carlos@biancorelab.com",
        "Regalos a clientes": "francisco@biancorelab.com",
        "Servicios Comerciales Amazon Mexico": "francisco@biancorelab.com"
      },
      'Contabilidad': {
        "IMSS": "cloera@biancorelab.com",
        "RCV - Infonavit": "cloera@biancorelab.com",
        "ISR Sueldos y Salarios": "cloera@biancorelab.com",
        "Impuesto Sobre Nomina Estatal (3%)": "cloera@biancorelab.com",
        "IVA acreditable": "cloera@biancorelab.com",
        "IVA Trasladado": "cloera@biancorelab.com",
        "IVA retenciones a terceros": "cloera@biancorelab.com",
        "ISR retenciones a terceros": "cloera@biancorelab.com",
        "Provisión ISR P.M": "cloera@biancorelab.com",
      },
      'Finanzas': {
        "Renta Oficinas": "cloera@biancorelab.com",
        "Renta Bodega 1 Archivo Fiscal": "cloera@biancorelab.com",
        "Renta Bodega 2 Torre Ganesh": "cloera@biancorelab.com",
        "Refrendos Vehicular": "cloera@biancorelab.com",
        "Arrendamiento (Autos)": "cloera@biancorelab.com",
        "Asesoria Odoo": "luis@biancorelab.com",
        "Asesoria y admon office 365": "luis@biancorelab.com",
        "Asesoria Comité de Finanzas": "luis@biancorelab.com",
        "Asesoria Legal (RRS, Abogados)": "carlos@biancorelab.com",
        "Asesoria Contable y Fiscal": "cloera@biancorelab.com",
        "Luz": "cloera@biancorelab.com",
        "Telefonia y Comunicaciones (Internet)": "cloera@biancorelab.com",
        "Paqueteria y mensajeria": "cloera@biancorelab.com",
        "Licencia Office 365": "luis@biancorelab.com",
        "Licencias Odoo Technologies": "luis@biancorelab.com",
        "Boga Servicios Empresariales (Capacitación admon)": "cloera@biancorelab.com",
        "Seguro Zurich Santander ZEIT acevedo P.111406051": "cloera@biancorelab.com",
        "Axa Seguros Eduardo Macias Control de gastos medicos P.92484AQ02": "cloera@biancorelab.com",
        "Seguro Zurich Santander Luis Ceballos P.1 64 0000045844-1": "cloera@biancorelab.com",
        "BBVA Seguros Vida Crédito Pyme Luis Ceballos Q1NB1801D1": "cloera@biancorelab.com",
        "BBVA Seguros Vida Crédito Pyme Luis Ceballos Q3NB1802UP": "cloera@biancorelab.com",
        "BBVA Seguros Vida Crédito Pyme Luis Ceballos 12MB7000SE": "cloera@biancorelab.com",
        "BBVA Seguros Vida Crédito Pyme Luis Ceballos P016NB7000HT": "cloera@biancorelab.com",
        "MultipleZurich1 29 25116 - 1 AHUIZOTL": "cloera@biancorelab.com",
        "MultipleZurich1 29 0000029815-1 Adolf Horn": "cloera@biancorelab.com",
        "Empresa SeguraBBVA SegurosQ1Nb1801D1 AHUIZOTL": "cloera@biancorelab.com",
        "Resp CivilGMX303-76-07-000106 COSCO": "cloera@biancorelab.com",
        "Empresa SeguraBBVA SegurosP0Q6NB1808X7 AHUIZOTL": "cloera@biancorelab.com",
        "BIANCORE LAB SA DE CV Mariana Rivas DF HYUNDAI": "cloera@biancorelab.com",
        "BIANCORE LAB SA DE CV Luis Ceballos GDL TOYOTA": "cloera@biancorelab.com",
        "Mtto de Equipo de Transporte (Luis)": "cloera@biancorelab.com",
        "Mtto de Equipo de Transporte (Carlos)": "cloera@biancorelab.com",
        "Mtto de Equipo de Transporte (Mariana)": "cloera@biancorelab.com",
        "Mantenimiento Fijo Torre Ganesh": "cloera@biancorelab.com",
        "Mantenimiento Extemporaneo": "cloera@biancorelab.com",
        "Einar Zavala Flores": "luis@biancorelab.com",
        "Mto de Equipo de Computo": "luis@biancorelab.com",
        "SW Sapien (Timbres fiscales)": "luis@biancorelab.com",
        "KSTRT Alejandro": "luis@biancorelab.com",
        "Accesorios y dispositivos externos": "luis@biancorelab.com",
        "Licencia Municipal": "cloera@biancorelab.com",
        "Libros y revistas": "cloera@biancorelab.com",
        "Papeleria y Articulos de Oficina": "cloera@biancorelab.com",
        "Caja chica": "cloera@biancorelab.com",
        "Apoyo en gasolina": "luis@biancorelab.com",
        "Combustibles y Lubricantes": "luis@biancorelab.com",
        "Viaticos Mid-Office": "luis@biancorelab.com",
        "No deducibles": "cloera@biancorelab.com",
        "Detecno": "francisco@biancorelab.com",
        "AIR Logistic gps": "francisco@biancorelab.com",
        "Anadim": "francisco@biancorelab.com",
        "Carvajal Tecnologia y Servicios": "francisco@biancorelab.com",
        "Nadro": "francisco@biancorelab.com",
        "Tiendas Chedraui": "francisco@biancorelab.com",
        "Tiendas Soriana": "francisco@biancorelab.com",
        "Time Tracker de Mexico (City Fresko)": "francisco@biancorelab.com",
        "Wendy Isabel Navarrete Navarrete (Buzón Soriana)": "francisco@biancorelab.com",
        "Credito BBVA 1 6269": "cloera@biancorelab.com",
        "Credito BBVA 2 5020 (15.7668%)": "cloera@biancorelab.com",
        "Credito BBVA 3  Simple (9.57%)": "cloera@biancorelab.com",
        "Credito BBVA simple PYME 4  2970 (17.75%)": "cloera@biancorelab.com",
        "Intereses ordinarios por créditos - Credito BBVA 1": "cloera@biancorelab.com",
        "Intereses ordinarios por créditos - Credito BBVA 2 15.7668%": "cloera@biancorelab.com",
        "Intereses ordinarios por créditos - BBVA 3 9.57%": "cloera@biancorelab.com",
        "Intereses ordinarios por créditos - BBVA simple PYME 4 17.75%": "cloera@biancorelab.com",
        "Intereses ordinarios por créditos - Santander Crédito Ágil": "cloera@biancorelab.com",
        "Intereses Carlos": "cloera@biancorelab.com",
        "Intereses Ivette": "cloera@biancorelab.com",
        "Comisiones Bancarias": "cloera@biancorelab.com",
        "Comisiones por aperturas de creditos (2.5% Sobre monto de crédito)": "cloera@biancorelab.com",
        "Gastos Financieros (Factoraje)": "luis@biancorelab.com",
        "Tarjeta de Credito American Express": "luis@biancorelab.com",
        "Utilidad o Perdida Cambiaria": "cloera@biancorelab.com",
      },
      'I + D': {
        "Analisis microbiologicos": "carlos@biancorelab.com",
        "Irritabiidad y sensibilidad": "carlos@biancorelab.com",
        "Prorrogas de registro": "carlos@biancorelab.com",
        "Proveeduría": "carlos@biancorelab.com",
        "Benchmarck": "carlos@biancorelab.com",
        "Compra de información (data)": "carlos@biancorelab.com",
        "Elaboración de prototipo": "carlos@biancorelab.com",
        "GS1": "carlos@biancorelab.com",
        "Hosting Web": "carlos@biancorelab.com",
        "Dominio - biancorelab.com": "carlos@biancorelab.com",
        "Dominio - safty.com.mx": "carlos@biancorelab.com",
        "Viaticos i+d": "carlos@biancorelab.com",
        "Dominio - safty.mx": "carlos@biancorelab.com",
        "Dominio - safty.mx (página web)": "carlos@biancorelab.com",
        },
        'Mkt': {
          "Licencia de Adobe": "carlos@biancorelab.com",
          "Banco de imagens (envato)": "carlos@biancorelab.com",
          "Estudio de mercado Nobook": "carlos@biancorelab.com",
          "Viaticos Presidente Comité I + D": "carlos@biancorelab.com",
          "Muestras de productos": "francisco@biancorelab.com",
          "Estudios de mercado (resto)": "carlos@biancorelab.com",
          "Cosmoprof Las Vegas": "carlos@biancorelab.com",
          "Servicios de Consultoria de Estratgia (Alberto)": "carlos@biancorelab.com",
          "Promoción": "carlos@biancorelab.com",
          "Demos Bye Bites": "carlos@biancorelab.com",
          "Expo Chedraui": "carlos@biancorelab.com",
          "Expo Walmart": "carlos@biancorelab.com",
          "Find Keepers": "carlos@biancorelab.com",
          "Branding (POS)": "carlos@biancorelab.com",
          "Espectacular Vallarta": "carlos@biancorelab.com",
          "Espectacular CDMX": "carlos@biancorelab.com",
          "Medios": "carlos@biancorelab.com",
          "Página web - biancorelab.com": "carlos@biancorelab.com",
          "Página web - biancorelab.usa": "carlos@biancorelab.com",
          "Página web - byebites.usa": "carlos@biancorelab.com",
          "Página web - proself.usa": "carlos@biancorelab.com",
          "Merchandising - Bye Bites": "carlos@biancorelab.com",
          "Merchandising - Proself": "carlos@biancorelab.com",
        },
        'Recursos Humanos / DO': {
          "Kit de Bienvenida": "ihernandez@biancorelab.com",
          "Créditos OCC (Bolsa de trabajo)": "ihernandez@biancorelab.com",
          "Créditos OCC Linkedin (Bolsa de trabajo)": "ihernandez@biancorelab.com",
          "Créditos OCC Computrabajo (Bolsa de trabajo)": "ihernandez@biancorelab.com",
          "Examenes Psicométricos": "ihernandez@biancorelab.com",
          "Seguro de gastos Medicos Mayores": "ihernandez@biancorelab.com",
          "Apoyo de Transporte (Ejecutivos - KAMs)": "ihernandez@biancorelab.com",
          "Uniformes": "ihernandez@biancorelab.com",
          "Capacitación Comercial": "ihernandez@biancorelab.com",
          "Capacitación Contabilidad - Finanzas - Operaciones": "ihernandez@biancorelab.com",
          "Capacitación I + D": "ihernandez@biancorelab.com",
          "Cumpleaños": "ihernandez@biancorelab.com",
          "Evaluación de Clima Laboral": "ihernandez@biancorelab.com",
          "Evaluación NOM035": "ihernandez@biancorelab.com",
          "Estudio de Sueldos 2024": "ihernandez@biancorelab.com",
          "Posada - Convención": "ihernandez@biancorelab.com",
          "Reconocimientos": "ihernandez@biancorelab.com",
          "Honorarios Juridicos (Miguel Angel ALcaraz Ceballos)": "ihernandez@biancorelab.com",
          "Asesoria Direccion (APV)": "luis@biancorelab.com",
          "Asesoria Comité Comercial (APV)": "carlos@biancorelab.com",
          "Asesoria Comité I+D (APV)": "carlos@biancorelab.com",
          "Cuota Sindical": "ihernandez@biancorelab.com",
          "Articulos de Limpieza y Cocina": "ihernandez@biancorelab.com",
          "Articulos de Cafeteria": "ihernandez@biancorelab.com",
          "Botiquin": "ihernandez@biancorelab.com",
            
        },
        'Trade Mkt': {
          "Credenciales Promotores - comerciales": "ecortes@biancorelab.com",
          "Licencia Field (Trademkt)": "francisco@biancorelab.com",
          "Concursos - Chedraui": "francisco@biancorelab.com",
          "Concursos -Mayoristas": "francisco@biancorelab.com",
          "Concursos -Promotores": "francisco@biancorelab.com",
          "Sampling - Sachet Crema PROSELF (Envios)": "francisco@biancorelab.com",
          "Sampling - Crema Baby (envios)": "francisco@biancorelab.com",
          "Sampling - Club de Golf": "francisco@biancorelab.com",
          "Sampling - Expo Chedraui": "francisco@biancorelab.com",
          "Sampling - Expo Walmart": "francisco@biancorelab.com",
          "Sampling - Expo Soriana": "francisco@biancorelab.com",
          "Sampling - ANADIM": "francisco@biancorelab.com",
          "Exhibición - Soriana": "francisco@biancorelab.com",
          "Exhibición - Walmart Connect BB": "francisco@biancorelab.com",
          "Material POP - Bye Bites": "francisco@biancorelab.com",
          "Material POP - Proself": "francisco@biancorelab.com",
          "Material POP - Fajin / Liston Regalo PROSELF": "francisco@biancorelab.com",
          "Apoyo de Transporte (Promotoria)": "francisco@biancorelab.com",
          "Viaticos Promotores Foraneos": "francisco@biancorelab.com",
          "Herramientas": "francisco@biancorelab.com",
          "Demo Pto Vta": "francisco@biancorelab.com",
          "Demo Huatulco": "francisco@biancorelab.com",
          "Demo Tulum": "francisco@biancorelab.com",
          "Vuelos 1": "francisco@biancorelab.com",
          "Transporte 1": "francisco@biancorelab.com",
          "Alimentos 1": "francisco@biancorelab.com",
          "Hospedaje 1": "francisco@biancorelab.com",
          "Vuelos 2": "francisco@biancorelab.com",
          "Transporte 2": "francisco@biancorelab.com",
          "Alimentos 2": "francisco@biancorelab.com",
          "Hospedaje 2": "francisco@biancorelab.com",
        }
    };


    areaSelect.addEventListener('change', function() {
      const selectedArea = this.value;
      const budgetItems = areaToBudgetItems[selectedArea] || {};
      budgetItemSelect.innerHTML = ''; // Limpiar las opciones existentes
    
      Object.keys(budgetItems).forEach(budgetItem => {
          let email = budgetItems[budgetItem]; // Obtiene el correo electrónico asociado
          let option = new Option(budgetItem, budgetItem); // Asigna el nombre del rubro como valor del option
          budgetItemSelect.add(option);
      });
    
      // Actualizar el correo basado en la primera selección o dejarlo para el evento change
      if (Object.keys(budgetItems).length > 0) {
        emailField.value = budgetItems[Object.keys(budgetItems)[0]]; // Establece el correo del primer rubro
      }
    });
    
    // Evento de cambio para el selector de rubros
    budgetItemSelect.addEventListener('change', function() {
      const selectedBudgetItem = this.value; // El nombre del rubro seleccionado
      const email = areaToBudgetItems[areaSelect.value][selectedBudgetItem]; // Obtiene el correo usando el área y el rubro seleccionado
      emailField.value = email; // Actualiza el campo de correo electrónico
    });
    // Población inicial de las áreas
    Object.keys(areaToBudgetItems).forEach(area => {
      let option = new Option(area, area);
      areaSelect.add(option);
    });
    
    // Disparar el evento change manualmente para cargar los rubros iniciales
    areaSelect.dispatchEvent(new Event('change'));

  // Inicializar las firmas
  const signaturePadApplicant = new SignaturePad(document.getElementById('firma'));

  // Botones para guardar y limpiar las firmas
  document.getElementById('enviar').addEventListener('click', () => {
    const dataUrl = signaturePadApplicant.toDataURL();
    // Puedes guardar esta data URL en Firebase o donde sea necesario
  });

  document.getElementById('clear-applicant').addEventListener('click', () => {
    signaturePadApplicant.clear();
  });



  // Enviar el formulario completo
  document.getElementById('enviar').addEventListener('click', async () => {
    // Asegúrate de que todas las validaciones del formulario se han pasado antes de ejecutar esto

    // Recopilar información del formulario
    const miFormulario = {
      applicant: document.getElementById('applicant').value,
      productService: document.getElementById('productService').value,
      quantity: document.getElementById('quantity').value,
      provider: document.getElementById('provider').value,
      description: document.getElementById('description').value,
      expenseAmount: document.getElementById('expenseAmount').value,
      paymentForm: document.getElementById('paymentForm').value,
      area: areaSelect.value,
      budgetItem: budgetItemSelect.value,
      date: dateInput.value,
      folio: document.getElementById('folio').value,
      signatureApplicant: signaturePadApplicant.toDataURL(),
    };

    // Guardar en Firestore
    try {
      const docRef = await db.collection('requisitions').add(miFormulario);
      console.log('Requisición guardada con ID: ', docRef.id);
      // Aquí podrías redirigir al usuario o mostrar un mensaje de éxito
    } catch (error) {
      console.error('Error guardando la requisición: ', error);
      // Aquí podrías mostrar un mensaje de error
    }
  });

  // Iniciar la selección de área para cargar los rubros presupuestales
  areaSelect.dispatchEvent(new Event('change'));
});


// Aquí añades la lógica para manejar la firma y el envío de datos.
