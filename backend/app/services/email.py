import os
import logging

import resend

logger = logging.getLogger(__name__)

resend.api_key = os.environ.get("RESEND_API_KEY", "")
EMAIL_REMETENTE = os.environ.get("EMAIL_REMETENTE", "Catasucata <nao-responda@catasucata.com.br>")


def enviar_email(destinatario: str, assunto: str, html: str) -> bool:
    """
    Envio transacional (redefinição de senha, etc.) -- não confundir
    com a campanha de outreach em massa pras desmontadoras, que é
    outro fluxo (Resend broadcast, rodado à parte, não por aqui).

    Se RESEND_API_KEY não estiver configurada, loga e não quebra o
    fluxo que chamou -- melhor a pessoa não receber o e-mail do que a
    API inteira cair por causa disso. Verificar o log nesse caso.
    """
    if not resend.api_key:
        logger.error("RESEND_API_KEY não configurada -- e-mail para %s não enviado.", destinatario)
        return False
    try:
        resend.Emails.send({
            "from": EMAIL_REMETENTE,
            "to": [destinatario],
            "subject": assunto,
            "html": html,
        })
        return True
    except Exception:
        logger.exception("Falha ao enviar e-mail para %s", destinatario)
        return False


def email_redefinicao_senha(destinatario: str, link: str) -> bool:
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background:#000; padding: 16px 24px;">
        <span style="color:#fff; font-size:18px; font-weight:bold;">CATASUCATA</span>
      </div>
      <div style="padding: 24px;">
        <h2 style="color:#16181b;">Redefinir sua senha</h2>
        <p style="color:#333; font-size:15px; line-height:1.5;">
          Recebemos um pedido pra redefinir a senha da sua conta no Catasucata.
          Se foi você, clique no botão abaixo. Esse link vale por 30 minutos.
        </p>
        <a href="{link}" style="display:inline-block; background:#2e5c8a; color:#fff;
           padding:12px 24px; text-decoration:none; font-weight:bold; margin: 16px 0;">
          Redefinir senha
        </a>
        <p style="color:#888; font-size:13px;">
          Se você não pediu isso, pode ignorar esse e-mail -- sua senha continua a mesma.
        </p>
      </div>
    </div>
    """
    return enviar_email(destinatario, "Redefinir sua senha — Catasucata", html)


def email_senha_redefinida_pelo_admin(destinatario: str, senha_temporaria: str) -> bool:
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background:#000; padding: 16px 24px;">
        <span style="color:#fff; font-size:18px; font-weight:bold;">CATASUCATA</span>
      </div>
      <div style="padding: 24px;">
        <h2 style="color:#16181b;">Sua senha foi redefinida</h2>
        <p style="color:#333; font-size:15px; line-height:1.5;">
          A equipe do Catasucata redefiniu sua senha a seu pedido. Sua senha
          temporária é:
        </p>
        <p style="font-size:20px; font-weight:bold; letter-spacing:0.05em;
           background:#f1f2f4; padding:12px; text-align:center;">{senha_temporaria}</p>
        <p style="color:#333; font-size:15px; line-height:1.5;">
          Recomendamos trocar essa senha assim que entrar, em Minha conta.
        </p>
      </div>
    </div>
    """
    return enviar_email(destinatario, "Sua senha foi redefinida — Catasucata", html)
