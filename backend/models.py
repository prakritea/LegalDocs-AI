from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, create_engine
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
import datetime

import os
from dotenv import load_dotenv

# Load .env from project root (one level up from this file)
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(root_dir, ".env"), override=True)

# Determine Database URL
# Default fallback to a fixed users.db in the root directory
default_db_path = os.path.join(root_dir, "users.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_path}")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Postgres or other databases
    engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

# Create SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    
    documents = relationship("ProcessedDocument", back_populates="owner")

class ProcessedDocument(Base):
    __tablename__ = "processed_documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    summary = Column(Text) # Storing as text for simplicity in SQLite, or JSON
    sources = Column(JSON) # Sources list
    file_size = Column(String)
    file_type = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="documents")

# Create tables
Base.metadata.create_all(bind=engine)
