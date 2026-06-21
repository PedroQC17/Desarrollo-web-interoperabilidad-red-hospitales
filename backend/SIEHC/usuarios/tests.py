from django.test import TestCase
from datetime import date
from rest_framework.test import APIClient
from rest_framework import status

from usuarios.models import Usuario, Paciente, Medico, Administrador
from services.gestion_usuarios.registro_usuarios import register_usuario, login_usuario


class UsuarioModelTest(TestCase):
    datos_usuario = {
        "email": "juan.perez@hospital.com",
        "password": "Segura123!",
        "nombre": "Juan Pérez García",
        "telecom": "987654321",
        "genero": "M",
        "fec_nac": date(1995, 5, 15),
        "tipo_usuario": "paciente",
    }

    def test_crear_usuario_y_verificar_en_bd(self):
        user = Usuario.objects.create_user(**self.datos_usuario)
        usuario_bd = Usuario.objects.get(email="juan.perez@hospital.com")
        self.assertEqual(usuario_bd, user)
        self.assertEqual(usuario_bd.email, "juan.perez@hospital.com")
        self.assertEqual(usuario_bd.tipo_usuario, "paciente")

    def test_crear_perfil_paciente_automatico(self):
        user = Usuario.objects.create_user(**self.datos_usuario)
        Paciente.objects.create(usuario=user)
        self.assertTrue(Paciente.objects.filter(usuario=user).exists())


class UsuarioServiceTest(TestCase):
    datos_usuario = {
        "email": "maria.lopez@hospital.com",
        "password": "ClaveSegura456!",
        "nombre": "María López Torres",
        "telecom": "987654322",
        "genero": "F",
        "fec_nac": date(1998, 8, 20),
        "tipo_usuario": "paciente",
    }

    def test_register_exitoso_con_perfil(self):
        user = register_usuario(**self.datos_usuario)
        self.assertIsNotNone(user)
        self.assertEqual(Usuario.objects.count(), 1)
        self.assertTrue(Paciente.objects.filter(usuario=user).exists())

    def test_register_email_duplicado(self):
        register_usuario(**self.datos_usuario)
        with self.assertRaises(ValueError):
            register_usuario(**self.datos_usuario)

    def test_register_crea_perfil_segun_rol(self):
        def _probar_rol(tipo, clase_perfil):
            datos = dict(self.datos_usuario)
            datos["email"] = f"carlos.{tipo}@hospital.com"
            datos["nombre"] = f"Carlos {tipo.capitalize()} Sánchez"
            datos["tipo_usuario"] = tipo
            user = register_usuario(**datos)
            self.assertTrue(clase_perfil.objects.filter(usuario=user).exists())

        _probar_rol("medico", Medico)
        _probar_rol("admin", Administrador)

    def test_login_usuario_inactivo(self):
        Usuario.objects.create_user(**self.datos_usuario)
        user = Usuario.objects.get(email="maria.lopez@hospital.com")
        user.is_active = False
        user.save()
        resultado = login_usuario("maria.lopez@hospital.com", "ClaveSegura456!")
        self.assertIsNone(resultado)


class UsuarioAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.datos_valido = {
            "email": "ana.martinez@hospital.com",
            "password": "AnaPass789!",
            "nombre": "Ana Martínez Ruiz",
            "telecom": "987654323",
            "genero": "F",
            "fec_nac": "2002-03-10",
            "tipo_usuario": "paciente",
        }

    def test_post_register_201(self):
        respuesta = self.client.post("/api/usuarios/register/", self.datos_valido, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", respuesta.data)
        self.assertIn("refresh", respuesta.data)
        self.assertEqual(respuesta.data["email"], "ana.martinez@hospital.com")

    def test_post_register_sin_email_400(self):
        datos_invalidos = {
            "password": "AnaPass789!",
            "nombre": "Ana Martínez Ruiz",
            "telecom": "987654323",
            "genero": "F",
            "fec_nac": "2002-03-10",
            "tipo_usuario": "paciente",
        }
        respuesta = self.client.post("/api/usuarios/register/", datos_invalidos, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
