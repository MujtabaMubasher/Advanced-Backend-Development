import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },
    videoFile: {
      type: String, // Cloudanary Url
      required: true,
    },

    thumbnail: {
      type: String, // Cloudanary Url
      required: true,
    },

    isPublish: {
      type: Boolean,
      default: true,
    },

    duration: {
      type: Number, 
      required: true,
    },

    views: {
      type: Number,
      default: 0,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema )

