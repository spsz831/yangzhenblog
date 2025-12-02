-- Ensure the admin user exists with the correct password hash ('password')
INSERT OR IGNORE INTO users (username, email, password_hash, nickname, created_at) 
VALUES ('admin', 'admin@example.com', '$2b$10$VzffISXFTdOLcXQ3XtrM2eFwGTSzsH.aPiFNMO2yT9/ad.vXdnz5y', 'Admin', unixepoch());

-- If the user already existed but had a wrong hash (e.g. from previous attempts), update it
UPDATE users 
SET password_hash = '$2b$10$VzffISXFTdOLcXQ3XtrM2eFwGTSzsH.aPiFNMO2yT9/ad.vXdnz5y' 
WHERE username = 'admin';
