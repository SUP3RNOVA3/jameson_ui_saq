import { useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useMqttState } from "~/@mqtt-react-hooks";
import useSocket from "~/components/useSocket";

import Input from "~/lib/Input";
import Checkbox from "~/lib/Checkbox";

import { AppContext, IVideoInfo } from "~/components/AppContext";
import { MQTT_TOPICS, ROLES, SOCKET_TOPICS } from "~/lib/constants";
import Select from "~/lib/Select";

const InitiatorAcknowledge = () => {
  const navigate = useNavigate();
  const { client } = useMqttState();
  const { boothInfo, updateBoothInfo, videoInfo, updateVideoInfo } = useContext(AppContext);

  const [socket, isLoading, error, addListener, emitMessage] = useSocket();

  const ageArray = Array.from({length: 63}, (_, i) => i + 18);

  //get role from url

  useEffect(() => {
    //console.log(videoInfo);
    if (socket && socket.connected && !videoInfo.sessionId) {
      //console.log("emitting get token");
      emitMessage("GET_TOKEN");
    }
  }, [socket, emitMessage]);

  useEffect(() => {
    prepareForCall();
  }, []);

  useEffect(() => {
    if (socket) {
      const _onTokenRcvd = addListener(SOCKET_TOPICS.__TOKEN, onTokenReceived);

      return () => {
        _onTokenRcvd();
      };
    }
  }, [socket, addListener]);

  const onTokenReceived = (sessionToken: { session_id: string; token: string }) => {
    //console.log("token recieved", sessionToken);
    const { session_id: sessionId, token } = sessionToken;

    const videoInfo: IVideoInfo = {
      sessionId,
      token,
      incomming_sessionId: sessionId,
      incomming_token: token,
      status: "ringing",
      initiator: boothInfo?.mac,
      receiver: "",
    };
    //update video info context
    updateVideoInfo(videoInfo);

    //publish video info to mqtt
    const payload = {
      ...videoInfo,
    };

    

    console.log("updating booth info to publisher");
    updateBoothInfo({ ...boothInfo, role: "publisher" });

    client?.publish(MQTT_TOPICS.CALL_RING, JSON.stringify(payload));
  };

  const prepareForCall = () => {
    if (!videoInfo.sessionId) return;

    const payload = {
      ...videoInfo,
    };

    client?.publish(MQTT_TOPICS.CALL_RING, JSON.stringify(payload));
  };

  const onNext = () => {
    client?.publish(
      MQTT_TOPICS.CALL_CONNECTING,
      JSON.stringify({ ...videoInfo, status: videoInfo.status === "connecting" ? "connected" : "connecting" })
    );

    navigate(`/start/call`);
  };

  return (
    <>
      <div className="flex flex-col justify-between mx-auto pt-20">
        <h1 className="text-6xl">Ready to connect?</h1>

        <h2 className="mt-5 text-2xl w-3/4 mx-auto leading-10">
          {" "}
          If you connect with a stranger for at least a minute, both of you will get a free drink. Do you accept?
        </h2>
      </div>

      {/*Form to get user name, last name, email and phone and ask them to accept t&C */}
      <form className="flex flex-col w-3/4 mx-auto">
        <div className="flex flex-row ">
          <div className=" w-full text-center mt-8">
            <Select
              name="age"
              isRequired={true}
              type="number"
              placeholder="Tell us your age"
              onChange={(e) => console.log(e.target.value)}
              options={ageArray.map((age) => ({ value: age.toString(), name: age.toString() }))}
              pClassName="large-select"
            />
          </div>
          {/* <div className=" w-1/2">
            <Input
              name="lastname"
              isRequired={true}
              type="text"
              placeholder="Enter your last name"
              onChange={(e) => console.log(e.target.value)}
            />
          </div> */}
        </div>
        {/* <div className="flex flex-row ">
          <div className=" w-1/2">
            <Input
              name="email"
              isRequired={true}
              type="email"
              placeholder="Enter your email"
              onChange={(e) => console.log(e.target.value)}
            />
          </div>
          <div className=" w-1/2">
            <Input
              name="phone"
              isRequired={true}
              type="tel"
              placeholder="Enter your phone number"
              onChange={(e) => console.log(e.target.value)}
            />
          </div>
        </div> */}

        <div className="flex flex-row ">
          <div className=" w-full text-center mt-8">
            <Checkbox
              name="t&C"
              pClassName="large-checkbox"
              label="I accept the terms and conditions"
              isRequired={true}
              onChange={(e) => console.log(e.target.value)}
            />
          </div>
        </div>
      </form>

      <button
        className="m-5 p-5 w-3/4 mx-auto border-slate-600 hover:border-slate-200"
        onClick={onNext}
        disabled={!videoInfo.sessionId}
      >
        Next
      </button>
    </>
  );
};

export default InitiatorAcknowledge;

const TermsAndConditions = () => (
  <>
    <div>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas id felis id ipsum vehicula interdum. Sed viverra
      velit nec lacus eleifend, ac commodo purus varius. Duis auctor pharetra magna, sed ullamcorper quam dignissim a.
      Integer commodo nulla sed risus rhoncus dictum. In hac habitasse platea dictumst. Proin ut velit sed arcu finibus
      fringilla id quis sapien. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;
      Quisque id nisl id mauris volutpat lobortis. Donec accumsan libero a velit tincidunt, at lobortis sapien maximus.
      Nullam aliquam euismod quam non cursus.
    </div>
    <div>
      Suspendisse potenti. Suspendisse lacinia, erat eget vulputate gravida, enim purus luctus lectus, eu scelerisque
      lorem metus vel massa. Vivamus elementum, dui eu malesuada euismod, magna eros commodo sapien, eget tristique leo
      magna in turpis. Fusce commodo ex at nibh pulvinar, eget viverra magna eleifend. Aliquam auctor purus nulla, eu
      consequat nunc feugiat vitae. Nulla facilisi. Sed semper metus velit, eu facilisis quam iaculis id. Sed tristique
      metus in felis dictum, id cursus nisl pharetra. Sed aliquam, enim eget mollis vestibulum, velit magna accumsan
      dui, ac sollicitudin tortor arcu at ante. Sed sit amet elit elit.
    </div>
    <div>
      Vestibulum sagittis leo non mi ultricies, eu laoreet odio cursus. Aliquam non bibendum erat. Curabitur ullamcorper
      fermentum lacus, eget interdum turpis fermentum sit amet. Pellentesque habitant morbi tristique senectus et netus
      et malesuada fames ac turpis egestas. Nunc a bibendum ante, ac facilisis magna. Fusce a nibh ac magna vestibulum
      faucibus. Duis aliquam nulla quis lobortis aliquam. Sed pretium a sapien nec elementum. In hac habitasse platea
      dictumst. Sed lobortis urna vel nisl bibendum faucibus.
    </div>
    <div>
      In eget leo vel velit tincidunt pharetra a nec urna. Curabitur gravida eros nec enim tincidunt malesuada.
      Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer quis mi
      vitae ante finibus aliquam non non orci. Sed eget nibh vitae arcu sagittis tincidunt. Ut euismod ornare lectus,
      eget pretium velit mattis vel. Nullam id nisi dui. Aliquam erat volutpat. Sed iaculis convallis tellus, sit amet
      euismod sapien pharetra eget.
    </div>
  </>
);
