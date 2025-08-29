import smtplib
import asyncio
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = settings.smtp_server
        self.smtp_port = settings.smtp_port
        self.smtp_username = settings.smtp_username
        self.smtp_password = settings.smtp_password
        self.from_email = settings.from_email
        
        # SMTP 설정이 완료되었는지 확인
        self.smtp_configured = bool(
            self.smtp_username and 
            self.smtp_password and 
            self.smtp_username != "your-email@gmail.com" and
            self.smtp_password != "your-app-password"
        )

    def send_verification_email(self, to_email: str, verification_code: str, user_name: str) -> bool:
        """이메일 인증 코드 발송"""
        try:
            subject = "협업 플래너 - 이메일 인증"
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">협업 플래너</h1>
                    <p style="margin: 10px 0; opacity: 0.9;">이메일 인증</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">안녕하세요, {user_name}님!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        협업 플래너 계정 인증을 위해 아래 인증 코드를 입력해주세요.
                    </p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">인증 코드</h3>
                        <div style="background: white; padding: 15px; border-radius: 6px; border: 2px solid #e9ecef;">
                            <span style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 3px;">{verification_code}</span>
                        </div>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        ⚠️ 이 인증 코드는 24시간 후에 만료됩니다.<br>
                        본인이 요청하지 않은 경우 이 이메일을 무시하셔도 됩니다.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2024 협업 플래너. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            
            # SMTP 설정이 완료되지 않았거나 개발 환경인 경우 콘솔에 출력
            if not self.smtp_configured or settings.environment == "development":
                logger.info(f"=== 이메일 인증 코드 (개발 환경) ===")
                logger.info(f"받는 사람: {to_email}")
                logger.info(f"인증 코드: {verification_code}")
                logger.info(f"================================")
                if not self.smtp_configured:
                    logger.warning("SMTP 설정이 완료되지 않았습니다. 실제 이메일 발송을 위해 .env 파일을 설정하세요.")
                return True
            
            # 실제 이메일 발송 (프로덕션 환경)
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = self.from_email
                msg['To'] = to_email
                
                html_part = MIMEText(html_content, 'html')
                msg.attach(html_part)
                
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
                
                logger.info(f"인증 이메일 발송 완료: {to_email}")
                return True
            except Exception as e:
                logger.error(f"이메일 발송 실패: {str(e)}")
                return False
            
        except Exception as e:
            logger.error(f"이메일 발송 실패: {str(e)}")
            return False
    
    def send_verification_email_async(self, to_email: str, verification_code: str, user_name: str) -> None:
        """이메일 인증 코드를 비동기로 발송합니다."""
        def _send_email():
            try:
                success = self.send_verification_email(to_email, verification_code, user_name)
                if success:
                    logger.info(f"비동기 이메일 발송 성공: {to_email}")
                else:
                    logger.error(f"비동기 이메일 발송 실패: {to_email}")
            except Exception as e:
                logger.error(f"비동기 이메일 발송 중 오류: {str(e)}")
        
        # 별도 스레드에서 이메일 발송
        thread = threading.Thread(target=_send_email)
        thread.daemon = True
        thread.start()
        logger.info(f"비동기 이메일 발송 시작: {to_email}")

    def send_reset_password_email(self, to_email: str, reset_token: str, user_name: str) -> bool:
        """비밀번호 재설정 이메일 발송"""
        try:
            subject = "협업 플래너 - 비밀번호 재설정"
            
            reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">협업 플래너</h1>
                    <p style="margin: 10px 0; opacity: 0.9;">비밀번호 재설정</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">안녕하세요, {user_name}님!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정하세요.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            비밀번호 재설정
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        ⚠️ 이 링크는 1시간 후에 만료됩니다.<br>
                        본인이 요청하지 않은 경우 이 이메일을 무시하시고, 계정 보안을 위해 비밀번호를 변경하세요.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2024 협업 플래너. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            
            # 개발 환경에서는 콘솔에 출력
            if settings.environment == "development":
                logger.info(f"=== 비밀번호 재설정 링크 (개발 환경) ===")
                logger.info(f"받는 사람: {to_email}")
                logger.info(f"재설정 링크: {reset_url}")
                logger.info(f"================================")
                return True
            
            # 실제 이메일 발송
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"비밀번호 재설정 이메일 발송 완료: {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"비밀번호 재설정 이메일 발송 실패: {str(e)}")
            return False 