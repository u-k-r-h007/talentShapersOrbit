import { web } from "../../PnpUrl";
import { useEffect, useState } from "react";

export const TrainerMethods = () => {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const getTrainers = async (): Promise<void> => {
      try {
        const list = await web.lists.getByTitle("TsharperTrainer").items
          .select(
            "Id,Title,FullName,Email,Phone,Gender,Profile,Address,Expertise/Id,Expertise/Title"
          )
          .expand("Expertise")
          .get();
    
          const sanitizeUrl = (url: string) => {
            if (!url) return "";
            if (url.startsWith("http://") || url.startsWith("https://")) return url;
            if (url.startsWith("https//")) return url.replace("https//", "https://");
            return `${window.location.origin}${url}`;
          };
        
        const formatted = list.map((item: any) => ({
          id: item.Id.toString(),
          name: item.FullName,
          email: item.Email,
          phone: item.Phone,
          address: item.Address,
          gender: item.Gender,
          imageUrl: sanitizeUrl(item.Profile?.Url),
          expertise: item.Expertise.map((ex: any) => ex.Id.toString()),
        }));
    
        setTrainers(formatted);
      } catch (err) {
        console.error("Error fetching trainers:", err);
      }
    };
    

    const getCourses = async () => {
      try {
        const items = await web.lists.getByTitle("TshapersCourses").items
          .select("Id", "Title")
          .get();
        const mappedCourses = items.map((item: any) => ({
          id: item.Id.toString(),
          name: item.Title,
        }));
        setCourses(mappedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    getCourses();
    getTrainers();
  }, []);

const uploadTrainerImage = async (file: File) => {
  const folder = web.getFolderByServerRelativeUrl("/sites/TSO/Pictures/TrainerImage");
  const uploadedFile = await folder.files.add(file.name, file, true);
  return uploadedFile.data.ServerRelativeUrl; // ServerRelativeUrl
};


  // 🔹 Add a new trainer
  const addTrainer = async (trainer: any) => {
    try {
          const profileField: any = trainer.imageFile
      ? { Url: await uploadTrainerImage(trainer.imageFile), Description: "Profile Picture" }
      : null;

    const item = await web.lists.getByTitle("TsharperTrainer").items.add({
      Title: trainer.name,
      FullName: trainer.name,
      Email: trainer.email,
      Phone: trainer.phone,
      Address: trainer.address,
      Gender: trainer.gender,
      Profile: profileField,
      ExpertiseId: { results: trainer.expertise.map((id: any) => parseInt(id)) },
    });

    const newTrainer: any = {
      ...trainer,
      id: item.data.Id.toString(),
      imageUrl: profileField?.Url ? `${window.location.origin}${profileField.Url}` : "",
    };
      setTrainers([...trainers, newTrainer]);
    } catch (err) {
      console.error("Error adding trainer:", err);
    }
  };

  // 🔹 Update trainer
  const updateTrainer = async (trainer: any): Promise<void> => {
    try {
          const profileFieldUpdate: any = trainer.imageFile
      ? { Url: await uploadTrainerImage(trainer.imageFile), Description: "Profile Picture" }
      : trainer.imageUrl
      ? { Url: trainer.imageUrl.replace(window.location.origin, ""), Description: "Profile Picture" }
      : null;

    await web.lists.getByTitle("TsharperTrainer").items.getById(parseInt(trainer.id)).update({
      FullName: trainer.name,
      Email: trainer.email,
      Phone: trainer.phone,
      Address: trainer.address,
      Gender: trainer.gender,
      Profile: profileFieldUpdate,
      ExpertiseId: { results: trainer.expertise.map((id: any) => parseInt(id)) },
    });

    const updatedTrainer = {
      ...trainer,
      imageUrl: profileFieldUpdate?.Url ? `${window.location.origin}${profileFieldUpdate.Url}` : trainer.imageUrl || "",
    };

    setTrainers(trainers.map((t) => (t.id === trainer.id ? updatedTrainer : t)));
    } catch (err) {
      console.error("Error updating trainer:", err);
    }
  };

  // 🔹 Delete trainer
  const deleteTrainer = async (id: string): Promise<void> => {
    try {
      await web.lists.getByTitle("TsharperTrainer").items.getById(parseInt(id)).delete();
      setTrainers(trainers.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting trainer:", err);
    }
  };

  return {
    trainers,
    courses,
    setCourses,
    addTrainer,
    updateTrainer,
    deleteTrainer,
  };
};