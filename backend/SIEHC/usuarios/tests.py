from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from usuarios.models import Usuario
from services.gestion_usuarios.registro_usuarios import register_usuario, login_usuario


class UsuarioServiceTest(TestCase):
    """Pruebas unitarias (sin API) para registro e inicio de sesión"""

    # --- REGISTRO ---

    def test_register_campos_vacios_error(self):
        """CP-RU-VAL-01: Validar campos vacíos en registro"""
        with self.assertRaises(ValueError):
            register_usuario(email="", password="", nombre="", telecom="", genero="", fec_nac="", tipo_usuario="")

    def test_register_password_corta_error(self):
        """CP-RU-VAL-04: Validar longitud mínima de contraseña"""
        with self.assertRaises(ValueError):
            register_usuario(email="test@mail.com", password="Ab1", nombre="Test", telecom="123456789", genero="M", fec_nac="2000-01-01", tipo_usuario="paciente")

    # --- LOGIN ---

    def test_login_campos_vacios(self):
        """CP-IS-VAL-01: Login con campos vacíos → None"""
        self.assertIsNone(login_usuario("", ""))

    def test_login_email_no_registrado(self):
        """CP-IS-VAL-02: Login con email no registrado → None"""
        self.assertIsNone(login_usuario("noexiste@mail.com", "Pass1234"))

    def test_login_password_incorrecta(self):
        """CP-IS-VAL-03: Login con contraseña incorrecta → None"""
        Usuario.objects.create_user(email="juan@mail.com", password="Pass1234", nombre="Juan", telecom="987654321", genero="M", fec_nac="2000-01-01", tipo_usuario="paciente")
        self.assertIsNone(login_usuario("juan@mail.com", "WrongPass99"))


class UsuarioAPITest(TestCase):
    """Pruebas de API para registro e inicio de sesión"""

    def setUp(self):
        self.client = APIClient()
        self.datos_valido = {"email": "ana@mail.com", "password": "AnaPass789!", "confirmar": "AnaPass789!", "nombre": "Ana Martínez", "telecom": "987654323", "genero": "F", "fec_nac": "2002-03-10", "tipo_usuario": "paciente"}

    # --- REGISTRO ---

    def test_post_register_campos_vacios_400(self):
        """CP-RU-VAL-01: Todos los campos vacíos → 400"""
        respuesta = self.client.post("/api/usuarios/register/", {}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_register_email_invalido_400(self):
        """CP-RU-VAL-02: Email inválido → 400"""
        datos = dict(self.datos_valido)
        datos["email"] = "correo-invalido"
        respuesta = self.client.post("/api/usuarios/register/", datos, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", respuesta.data)

    def test_post_register_password_mismatch_400(self):
        """CP-RU-VAL-03: Password != confirmar → 400"""
        datos = dict(self.datos_valido)
        datos["password"] = "Pass1234"
        datos["confirmar"] = "Pass5678"
        respuesta = self.client.post("/api/usuarios/register/", datos, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirmar", respuesta.data)

    def test_post_register_password_corta_400(self):
        """CP-RU-VAL-04: Password < 8 caracteres → 400"""
        datos = dict(self.datos_valido)
        datos["password"] = "Ab1"
        datos["confirmar"] = "Ab1"
        respuesta = self.client.post("/api/usuarios/register/", datos, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", respuesta.data)

    # --- LOGIN ---

    def test_post_login_campos_vacios_400(self):
        """CP-IS-VAL-01: Login con campos vacíos → 400"""
        respuesta = self.client.post("/api/usuarios/login/", {}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_login_email_no_registrado_400(self):
        """CP-IS-VAL-02: Login con email no registrado → 400"""
        respuesta = self.client.post("/api/usuarios/login/", {"email": "noexiste@mail.com", "password": "Pass1234"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Credenciales inválidas", str(respuesta.data))

    def test_post_login_password_incorrecta_400(self):
        """CP-IS-VAL-03: Login con contraseña incorrecta → 400"""
        self.client.post("/api/usuarios/register/", self.datos_valido, format="json")
        respuesta = self.client.post("/api/usuarios/login/", {"email": "ana@mail.com", "password": "WrongPass99"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Credenciales inválidas", str(respuesta.data))
