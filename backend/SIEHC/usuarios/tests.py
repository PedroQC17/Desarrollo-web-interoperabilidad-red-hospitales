from django.test import TestCase
from usuarios.models import Usuario

class UsuarioTest(TestCase):

    def test_crear_usuario(self):
        user = Usuario.objects.create_user(
            email="test@gmail.com",
            password="123456"
        )

        self.assertEqual(user.email, "test@gmail.com")
        self.assertTrue(user.check_password("123456"))

    def test_login(self):
        Usuario.objects.create_user(
            email="test@gmail.com",
            password="123456"
        )

        from django.contrib.auth import authenticate

        user = authenticate(email="test@gmail.com", password="123456")

        self.assertIsNotNone(user)