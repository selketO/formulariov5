from google.cloud import firestore
import pandas as pd

# Reemplaza 'tu-certificado-firebase.json' con el path a tu archivo de credenciales de Firebase
credenciales = './formulario-if---ft-firebase-adminsdk-u9bim-fd525dbea7.json'
# Inicializa el cliente de Firestore
db = firestore.Client.from_service_account_json(credenciales)

def exportar_firestore_a_excel(nombre_coleccion, nombre_archivo_excel):
    # Obtiene todos los documentos de la colección
    documentos = db.collection(nombre_coleccion).stream()

    # Crea una lista para almacenar los datos
    lista_datos = []
    for documento in documentos:
        # Añade los datos de cada documento a la lista
        lista_datos.append(documento.to_dict())

    # Crea un DataFrame de Pandas con los datos
    df = pd.DataFrame(lista_datos)

    # Escribe el DataFrame a un archivo Excel
    nombre_archivo = f'{nombre_archivo_excel}.xlsx'
    df.to_excel(nombre_archivo, index=False)
    
    return nombre_archivo

# Llamada a la función
nombre_archivo_excel = exportar_firestore_a_excel('formulariosAutorizados', 'FormulariosAutorizados')

print(f'Datos exportados a {nombre_archivo_excel}')
