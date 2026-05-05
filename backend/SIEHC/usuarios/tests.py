from django.test import TestCase
from datetime import date
from backend.SIEHC.services.gestion_usuarios.registro_usuarios import register_usuario, login_usuario


class UsuarioTestCase(TestCase):

    def test_registro_usuario(self):
        user = register_usuario(
            email="test@test.com",
            password="Password123!",
            nombre="Pedro",
            telecom="999999999",
            genero="M",
            fec_nac=date(2000, 1, 1)
        )

        self.assertIsNotNone(user)

    def test_registro_duplicado(self):
        register_usuario(
            email="test@test.com",
            password="Password123!",
            nombre="Pedro",
            telecom="999999999",
            genero="M",
            fec_nac=date(2000, 1, 1)
        )

        with self.assertRaises(ValueError):
            register_usuario(
                email="test@test.com",
                password="Password123!",
                nombre="Pedro",
                telecom="999999999",
                genero="M",
                fec_nac=date(2000, 1, 1)
            )

    def test_login_correcto(self):
        register_usuario(
            email="test@test.com",
            password="Password123!",
            nombre="Pedro",
            telecom="999999999",
            genero="M",
            fec_nac=date(2000, 1, 1)
        )

        user = login_usuario("test@test.com", "Password123!")

        self.assertIsNotNone(user)

    def test_login_invalido(self):
        user = login_usuario("fake@test.com", "123456")

        self.assertIsNone(user)