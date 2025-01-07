import React, { useState, useEffect } from "react";
import { MdAdd, MdClose, MdDeleteOutline, MdUpdate } from "react-icons/md";
import DateSelector from "../../components/Input/DateSelector";
import ImageSelector from "../../components/Input/ImageSelector";
import TagInput from "../../components/Input/TagInput";
import axiosInstance from "../../utils/axiosInstance";
import moment from "moment";
import { toast } from "react-toastify";

const AddEditTravelStory = ({
  storyInfo,
  type,
  onClose,
  getAllTravelStories,
}) => {
  const [title, setTitle] = useState(storyInfo?.title || "");
  const [storyImg, setStoryImg] = useState(storyInfo?.imageUrl || null);
  const [story, setStory] = useState(storyInfo?.story || "");
  const [visitedLocation, setVisitedLocation] = useState(
    storyInfo?.visitedLocation || []
  );
  const [visitedDate, setVisitedDate] = useState(
    storyInfo?.visitedDate || null
  );

  const [error, setError] = useState("");

  // Add New Travel Story
  const addNewTravelStory = async () => {
    try {
      // FormData to handle file and other data
      const formData = new FormData();
      formData.append("title", title);
      formData.append("story", story);
      formData.append("visitedLocation", visitedLocation);
      formData.append(
        "visitedDate",
        visitedDate ? moment(visitedDate).valueOf() : moment().valueOf()
      );

      if (storyImg) {
        formData.append("imageUrl", storyImg); // Add the image file to FormData
      }

      const response = await axiosInstance.post("/add-travel-story", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Set header for file upload
        },
      });

      if (response.data && response.data.story) {
        toast.success("Story Added Successfully");
        // Refresh stories
        getAllTravelStories();
        // Close modal or form
        onClose();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        // Handle unexpected errors
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  // Update Travel Story
  const updateTravelStory = async () => {
    const storyId = storyInfo._id;
    // console.log(storyId);

    try {
      // Create a FormData object to handle file and other data
      let formData = new FormData();
      formData.append("title", title);
      formData.append("story", story);
      formData.append("visitedLocation", visitedLocation);
      formData.append(
        "visitedDate",
        visitedDate ? moment(visitedDate).valueOf() : moment().valueOf()
      );

      // Add the image file to FormData if a new image is provided
      if (typeof storyImg === "string") {
        formData.append("imageUrl", storyImg);
        // console.log(storyImg);
      } else {
        // Use the existing image URL if no new image is provided
        formData.append("imageUrl", storyInfo.imageUrl || "");
        // console.log(storyInfo.imageUrl);
      }

      // Send a PUT request to update the travel story
      const response = await axiosInstance.put(
        `/edit-story/${storyId}`,
        formData
      );

      if (response.data && response.data.story) {
        toast.success("Story Updated Successfully");
        // Refresh stories
        getAllTravelStories();
        // Close modal or form
        onClose();
      }
    } catch (error) {
      // Handle errors and display appropriate messages
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleAddOrUpdateClick = () => {
    console.log("Input Data:", {
      title,
      storyImg,
      story,
      visitedLocation,
      visitedDate,
    });

    if (!title) {
      setError("Please enter the title");
      return;
    }

    if (!story) {
      setError("Please enter the story");
      return;
    }

    setError("");

    if (type === "edit") {
      updateTravelStory();
    } else {
      addNewTravelStory();
    }
  };

  // Delete story image and Update the story
  const handleDeleteStoryImage = async () => {
    // Deleting the image
    const deleteImgRes = await axiosInstance.delete("/delete-image", {
      params: {
        imageUrl: storyInfo.imageUrl,
      },
    });

    if (deleteImgRes.data) {
      const storyId = storyInfo._id;

      const postData = {
        title,
        story,
        visitedLocation,
        visitedDate: moment().valueOf(),
        imageUrl: "",
      };

      // Updating story
      const response = await axiosInstance.put(
        `/edit-story/${storyId}`,
        postData
      );
      setStoryImg(null);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <h5 className="text-xl font-medium text-slate-700">
          {type === "add" ? "Add Story" : "Update Story"}
        </h5>
        <div>
          <div className="flex items-center gap-3 bg-cyan-50/50 p-2 rounded-l-lg">
            {type === "add" ? (
              <button className="btn-small" onClick={handleAddOrUpdateClick}>
                <MdAdd className="text-lg" />
                ADD STORY
              </button>
            ) : (
              <>
                <button className="btn-small" onClick={handleAddOrUpdateClick}>
                  <MdUpdate className="text-lg" />
                  UPDATE STORY
                </button>
              </>
            )}

            <button className="" onClick={onClose}>
              <MdClose className="text-xl text-slate-400" />
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs pt-2 text-right">{error}</p>
          )}
        </div>
      </div>
      <div>
        <div className="flex-1 flex flex-col gap-2 pt-4">
          <label className="input-label">TITLE</label>
          <input
            type="text"
            className="text-2xl text-slate-950 outline-none"
            placeholder="A Day at the Great Wall"
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
          <div className="my-3">
            <DateSelector date={visitedDate} setDate={setVisitedDate} />
          </div>

          <ImageSelector
            image={storyImg}
            setImage={setStoryImg}
            handleDeleteImg={handleDeleteStoryImage}
          />

          <div className="flex flex-col gap-2 mt-4">
            <label className="input-label">STORY</label>
            <textarea
              type="text"
              className="text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded"
              placeholder="Your Story"
              rows={10}
              value={story}
              onChange={({ target }) => setStory(target.value)}
            />
          </div>

          <div className="pt-3">
            <label className="input-label">VISITED LOCATIONS</label>
            <TagInput tags={visitedLocation} setTags={setVisitedLocation} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditTravelStory;
