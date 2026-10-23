FROM python:3.9.18-slim-bookworm

WORKDIR /python-docker

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .

# Run app.py directly: it binds 0.0.0.0:$PORT (default 5050), which is
# what hosted platforms (Render, IBM Code Engine) expect. The old
# `flask run` command ignored $PORT and always used 5000.
CMD ["python3", "app.py"]
