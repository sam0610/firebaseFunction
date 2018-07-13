const functions = require('firebase-functions');

const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

exports.generateThumbnail = functions.storage.object().onFinalize((object) => {
   // [END generateThumbnailTrigger]
   // [START eventAttributes]
   const fileBucket = object.bucket; // The Storage bucket that contains the file.
   const filePath = object.name; // File path in the bucket.
   const contentType = object.contentType; // File content type.
   const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.
   // [END eventAttributes]

   // [START stopConditions]
   // Exit if this is triggered on a file that is not an image.
   if (!contentType.startsWith('image/')) {
      console.log('This is not an image.');
      return null;
   }

   // Get the file name.
   const fileName = path.basename(filePath);
   // Exit if the image is already a thumbnail.
   if (fileName.startsWith('thumb_')) {
      console.log('Already a Thumbnail.');
      return null;
   }
   // [END stopConditions]

   // [START thumbnailGeneration]
   // Download file from bucket.
   const bucket = gcs.bucket(fileBucket);
   const tempFilePath = path.join(os.tmpdir(), fileName);
   const metadata = {
      contentType: contentType,
   };
   return bucket.file(filePath).download({
      destination: tempFilePath,
   }).then(() => {
      console.log('Image downloaded locally to', tempFilePath);
      // Generate a thumbnail using ImageMagick.
      return spawn('convert', [tempFilePath, '-thumbnail', '500x500>', tempFilePath]);
   }).then(() => {
      console.log('Thumbnail created at', tempFilePath);
      // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
      const thumbFileName = `thumb_${fileName}`;
      const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
      // Uploading the thumbnail.
      return bucket.upload(tempFilePath, {
         destination: thumbFilePath,
         metadata: metadata,
      });
      // Once the thumbnail has been uploaded delete the local file to free up disk space.
   }).then(() => {

      fs.unlinkSync(tempFilePath);

      const config = {
         action: 'read',
         expires: '03-01-2500',
      };
      return Promise.all([
         thumbFile.getSignedUrl(config),
         file.getSignedUrl(config),
      ]);
   }).then((results) => {
      console.log('Got Signed URLs.');
      const thumbResult = results[0];
      const originalResult = results[1];
      const thumbFileUrl = thumbResult[0];
      const fileUrl = originalResult[0];
      // Add the URLs to the Database

      return admin.database().ref('staffPhoto/' + ).push({
         path: photoUrl,
         thumbnail: thumbFileUrl
      });

   });
   // [END thumbnailGeneration]
});
// [END generateThumbnail]