const getCloudinaryId = (url) => {
    return url.split("/").pop().split(".")[0];
};

export default getCloudinaryId;
