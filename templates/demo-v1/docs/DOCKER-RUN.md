# Run Dockerfile

docker build -t igrp-template .

docker run --rm -it -p 3000:3000 --name igrp-template igrp-template
